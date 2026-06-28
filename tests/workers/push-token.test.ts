import { describe, expect, it, vi } from 'vitest';
import {
  handleWorkerPushTokenRequest,
  matchWorkerPushTokenPath,
  PUSH_TOKEN_PLATFORMS,
  type PushTokenRepository,
} from '../../apps/workers/src/push-token';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeRequest = (
  method: string,
  url = 'https://w.test/notifications/push-token',
  body?: unknown,
  token?: string,
): Request => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const makeActor = () => ({
  id: 'user-001',
  authUserId: 'auth-001',
  role: 'adopter' as const,
  status: 'active' as const,
  memberships: [],
});

const makeAuthenticator = (actor: unknown = makeActor()) =>
  vi.fn().mockResolvedValue(actor);

const makeRepo = (overrides: Partial<PushTokenRepository> = {}): PushTokenRepository => ({
  upsertPushToken: vi.fn().mockResolvedValue(undefined),
  deletePushToken: vi.fn().mockResolvedValue(true),
  ...overrides,
});

// ─── matchWorkerPushTokenPath ────────────────────────────────────────────────

describe('matchWorkerPushTokenPath', () => {
  it('returns true for {notificationsPath}/push-token', () => {
    expect(matchWorkerPushTokenPath('/notifications/push-token', '/notifications')).toBe(true);
  });

  it('returns false for exact notificationsPath', () => {
    expect(matchWorkerPushTokenPath('/notifications', '/notifications')).toBe(false);
  });

  it('returns false for sub-path beyond push-token', () => {
    expect(matchWorkerPushTokenPath('/notifications/push-token/extra', '/notifications')).toBe(false);
  });

  it('returns false for preferences path', () => {
    expect(matchWorkerPushTokenPath('/notifications/preferences', '/notifications')).toBe(false);
  });

  it('returns false for read path', () => {
    expect(matchWorkerPushTokenPath('/notifications/abc/read', '/notifications')).toBe(false);
  });
});

// ─── PUSH_TOKEN_PLATFORMS ────────────────────────────────────────────────────

describe('PUSH_TOKEN_PLATFORMS', () => {
  it('contains ios, android, expo', () => {
    expect(PUSH_TOKEN_PLATFORMS).toContain('ios');
    expect(PUSH_TOKEN_PLATFORMS).toContain('android');
    expect(PUSH_TOKEN_PLATFORMS).toContain('expo');
  });
});

// ─── handleWorkerPushTokenRequest — method guard ──────────────────────────────

describe('handleWorkerPushTokenRequest — method guard', () => {
  it('returns 405 for GET', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('GET'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.status).toBe('method_not_allowed');
    expect(body.allowedMethods).toContain('POST');
    expect(body.allowedMethods).toContain('DELETE');
  });

  it('returns 405 for PATCH', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('PATCH'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(405);
  });
});

// ─── handleWorkerPushTokenRequest — auth ladder (POST) ───────────────────────

describe('handleWorkerPushTokenRequest — auth ladder', () => {
  it('returns 401 when bearer token is missing (POST)', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 't', platform: 'expo' }),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when authenticator is missing (POST)', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 't', platform: 'expo' }, 'tok'),
      pushTokenRepository: makeRepo(),
      authenticator: undefined,
    });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 501 before 401 when authenticator is missing and bearer is absent (ladder order)', async () => {
    // No bearer token AND no authenticator — spec ladder: 501 before 401.
    // Would return 401 if the bearer check ran first (the bug N-02 described).
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 't', platform: 'expo' }),
      pushTokenRepository: makeRepo(),
      authenticator: undefined,
    });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when actor resolves to null (POST)', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 't', platform: 'expo' }, 'tok'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(null),
    });
    expect(res.status).toBe(401);
  });

  it('returns 501 when pushTokenRepository is missing (POST)', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 't', platform: 'expo' }, 'tok'),
      pushTokenRepository: undefined,
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.status).toBe('push_token_repository_not_configured');
  });

  it('returns 401 when bearer token is missing (DELETE)', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('DELETE', undefined, { token: 't' }),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(401);
  });

  it('returns 501 when pushTokenRepository is missing (DELETE)', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('DELETE', undefined, { token: 't' }, 'tok'),
      pushTokenRepository: undefined,
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(501);
  });
});

// ─── handleWorkerPushTokenRequest — POST ──────────────────────────────────────

describe('handleWorkerPushTokenRequest — POST', () => {
  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('https://w.test/notifications/push-token', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await handleWorkerPushTokenRequest({
      request: req,
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 with token_required when token is missing', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { platform: 'expo' }, 'tok'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('invalid_payload');
    expect(body.reasons).toContain('token_required');
  });

  it('returns 400 with token_required when token is empty string', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: '  ', platform: 'expo' }, 'tok'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.reasons).toContain('token_required');
  });

  it('returns 400 with platform_invalid when platform is missing', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 'abc-token' }, 'tok'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('invalid_payload');
    expect(body.reasons).toContain('platform_invalid');
  });

  it('returns 400 with platform_invalid when platform is not recognised', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 'abc-token', platform: 'web' }, 'tok'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.reasons).toContain('platform_invalid');
  });

  it('returns 200 push_token_registered on success', async () => {
    const repo = makeRepo();
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 'ExponentPushToken[abc]', platform: 'expo' }, 'tok'),
      pushTokenRepository: repo,
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('push_token_registered');
    expect(repo.upsertPushToken).toHaveBeenCalledWith('user-001', 'ExponentPushToken[abc]', 'expo');
  });

  it('upserts correctly for ios platform', async () => {
    const repo = makeRepo();
    await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 'ios-apns-token', platform: 'ios' }, 'tok'),
      pushTokenRepository: repo,
      authenticator: makeAuthenticator(),
    });
    expect(repo.upsertPushToken).toHaveBeenCalledWith('user-001', 'ios-apns-token', 'ios');
  });

  it('upserts correctly for android platform', async () => {
    const repo = makeRepo();
    await handleWorkerPushTokenRequest({
      request: makeRequest('POST', undefined, { token: 'fcm-token', platform: 'android' }, 'tok'),
      pushTokenRepository: repo,
      authenticator: makeAuthenticator(),
    });
    expect(repo.upsertPushToken).toHaveBeenCalledWith('user-001', 'fcm-token', 'android');
  });
});

// ─── handleWorkerPushTokenRequest — DELETE ────────────────────────────────────

describe('handleWorkerPushTokenRequest — DELETE', () => {
  it('returns 400 with token_required when token is missing', async () => {
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('DELETE', undefined, {}, 'tok'),
      pushTokenRepository: makeRepo(),
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe('invalid_payload');
    expect(body.reasons).toContain('token_required');
  });

  it('returns 200 push_token_removed when token found', async () => {
    const repo = makeRepo({ deletePushToken: vi.fn().mockResolvedValue(true) });
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('DELETE', undefined, { token: 'ExponentPushToken[abc]' }, 'tok'),
      pushTokenRepository: repo,
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('push_token_removed');
    expect(repo.deletePushToken).toHaveBeenCalledWith('user-001', 'ExponentPushToken[abc]');
  });

  it('returns 404 push_token_not_found when token does not exist', async () => {
    const repo = makeRepo({ deletePushToken: vi.fn().mockResolvedValue(false) });
    const res = await handleWorkerPushTokenRequest({
      request: makeRequest('DELETE', undefined, { token: 'unknown-token' }, 'tok'),
      pushTokenRepository: repo,
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.status).toBe('push_token_not_found');
  });
});
