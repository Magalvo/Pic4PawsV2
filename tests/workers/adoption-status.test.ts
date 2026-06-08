import { describe, expect, it, vi } from 'vitest';
import {
  handleWorkerAdoptionStatusRequest,
  matchWorkerAdoptionStatusId,
  validateAdoptionStatusPayload,
} from '../../apps/workers/src/adoption-status';
import type { AdoptionStatusRepository } from '../../apps/workers/src/adoption-status';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeRequest = (
  method: string,
  url: string,
  token?: string,
): Request => {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, { method, headers });
};

const makeAuthenticator = (actor: unknown) => vi.fn().mockResolvedValue(actor);

const makeShelterActor = (shelterId: string) => ({
  id: 'shelter-user-id',
  authUserId: 'auth-shelter-id',
  role: 'shelter_owner' as const,
  status: 'active' as const,
  memberships: [
    {
      id: 'membership-001',
      userId: 'shelter-user-id',
      shelterId,
      role: 'shelter_owner' as const,
      deletedAt: null,
    },
  ],
});

const makeAdoptionRecord = (
  overrides: Partial<{ applicationId: string; shelterId: string; currentStatus: string }> = {},
) => ({
  applicationId: 'app-001',
  shelterId: 'shelter-001',
  currentStatus: 'submitted',
  ...overrides,
});

const makeRepo = (record: unknown = makeAdoptionRecord()): AdoptionStatusRepository => ({
  getAdoptionForStatus: vi.fn().mockResolvedValue(record),
  updateAdoptionStatus: vi.fn().mockResolvedValue(undefined),
});

// ─── matchWorkerAdoptionStatusId ─────────────────────────────────────────────

describe('matchWorkerAdoptionStatusId', () => {
  it('extracts applicationId from /adoptions/:id', () => {
    expect(matchWorkerAdoptionStatusId('/adoptions/app-123', '/adoptions')).toBe('app-123');
  });

  it('returns null for exact adoptionsPath (no sub-segment)', () => {
    expect(matchWorkerAdoptionStatusId('/adoptions', '/adoptions')).toBeNull();
  });

  it('returns null for extra segments after id', () => {
    expect(matchWorkerAdoptionStatusId('/adoptions/app-123/extra', '/adoptions')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchWorkerAdoptionStatusId('/sponsorships/app-123', '/adoptions')).toBeNull();
  });

  it('returns null for empty segment (trailing slash)', () => {
    expect(matchWorkerAdoptionStatusId('/adoptions/', '/adoptions')).toBeNull();
  });

  it('handles adoptionsPath that already ends with slash', () => {
    expect(matchWorkerAdoptionStatusId('/adoptions/app-abc', '/adoptions/')).toBe('app-abc');
  });
});

// ─── validateAdoptionStatusPayload ───────────────────────────────────────────

describe('validateAdoptionStatusPayload', () => {
  it('accepts under_review', () => {
    const result = validateAdoptionStatusPayload({ status: 'under_review' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.status).toBe('under_review');
  });

  it('accepts more_info_requested', () => {
    const result = validateAdoptionStatusPayload({ status: 'more_info_requested' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.status).toBe('more_info_requested');
  });

  it('accepts approved', () => {
    const result = validateAdoptionStatusPayload({ status: 'approved' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.status).toBe('approved');
  });

  it('accepts rejected', () => {
    const result = validateAdoptionStatusPayload({ status: 'rejected' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.status).toBe('rejected');
  });

  it('rejects draft (applicant-only status)', () => {
    const result = validateAdoptionStatusPayload({ status: 'draft' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('status_invalid');
  });

  it('rejects submitted (transition into shelter flow, not settable by shelter)', () => {
    const result = validateAdoptionStatusPayload({ status: 'submitted' });
    expect(result.valid).toBe(false);
  });

  it('rejects withdrawn (applicant-only status)', () => {
    const result = validateAdoptionStatusPayload({ status: 'withdrawn' });
    expect(result.valid).toBe(false);
  });

  it('rejects expired (system status)', () => {
    const result = validateAdoptionStatusPayload({ status: 'expired' });
    expect(result.valid).toBe(false);
  });

  it('rejects null payload', () => {
    const result = validateAdoptionStatusPayload(null);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('payload_must_be_object');
  });

  it('rejects payload without status field', () => {
    const result = validateAdoptionStatusPayload({});
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reasons).toContain('status_invalid');
  });
});

// ─── handleWorkerAdoptionStatusRequest ───────────────────────────────────────

describe('handleWorkerAdoptionStatusRequest', () => {
  it('returns 405 for non-PATCH method', async () => {
    const request = makeRequest('GET', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: {},
      adoptionStatusRepository: makeRepo(),
      authenticator: makeAuthenticator(makeShelterActor('shelter-001')),
    });

    expect(response.status).toBe(405);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 401 when no bearer token', async () => {
    const request = new Request('http://localhost/adoptions/app-001', { method: 'PATCH' });
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
    });

    expect(response.status).toBe(401);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no authenticator', async () => {
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
    });

    expect(response.status).toBe(501);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator returns null', async () => {
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
      authenticator: makeAuthenticator(null),
    });

    expect(response.status).toBe(401);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no repository', async () => {
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
      authenticator: makeAuthenticator(makeShelterActor('shelter-001')),
    });

    expect(response.status).toBe(501);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('adoption_status_repository_not_configured');
  });

  it('returns 400 for invalid status payload', async () => {
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'draft' },
      adoptionStatusRepository: makeRepo(),
      authenticator: makeAuthenticator(makeShelterActor('shelter-001')),
    });

    expect(response.status).toBe(400);
    const body = await response.json() as { status: string; reasons: string[] };
    expect(body.status).toBe('invalid_adoption_status');
    expect(body.reasons).toContain('status_invalid');
  });

  it('returns 404 when adoption application not found', async () => {
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
      adoptionStatusRepository: makeRepo(null),
      authenticator: makeAuthenticator(makeShelterActor('shelter-001')),
    });

    expect(response.status).toBe(404);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('adoption_not_found');
  });

  it('returns 403 when actor is not shelter member', async () => {
    const nonMember = {
      id: 'random-user',
      authUserId: 'auth-random',
      role: 'adopter' as const,
      status: 'active' as const,
      memberships: [],
    };
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
      adoptionStatusRepository: makeRepo(),
      authenticator: makeAuthenticator(nonMember),
    });

    expect(response.status).toBe(403);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('forbidden');
  });

  it('returns 200 with applicationId and newStatus on success', async () => {
    const actor = makeShelterActor('shelter-001');
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const repo = makeRepo();
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
      adoptionStatusRepository: repo,
      authenticator: makeAuthenticator(actor),
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; applicationId: string; newStatus: string };
    expect(body.status).toBe('ok');
    expect(body.applicationId).toBe('app-001');
    expect(body.newStatus).toBe('approved');
  });

  it('calls updateAdoptionStatus with correct applicationId and status', async () => {
    const actor = makeShelterActor('shelter-001');
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const repo = makeRepo();
    await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'under_review' },
      adoptionStatusRepository: repo,
      authenticator: makeAuthenticator(actor),
    });

    expect(repo.updateAdoptionStatus).toHaveBeenCalledWith({
      applicationId: 'app-001',
      status: 'under_review',
    });
  });

  it('passes applicationId to getAdoptionForStatus', async () => {
    const actor = makeShelterActor('shelter-001');
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-999', 'token');
    const repo = makeRepo(makeAdoptionRecord({ applicationId: 'app-999', shelterId: 'shelter-001' }));
    await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-999',
      payload: { status: 'more_info_requested' },
      adoptionStatusRepository: repo,
      authenticator: makeAuthenticator(actor),
    });

    expect(repo.getAdoptionForStatus).toHaveBeenCalledWith('app-999');
  });

  it('does not expose credential markers in response body', async () => {
    const actor = makeShelterActor('shelter-001');
    const request = makeRequest('PATCH', 'http://localhost/adoptions/app-001', 'token');
    const response = await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'rejected' },
      adoptionStatusRepository: makeRepo(),
      authenticator: makeAuthenticator(actor),
    });

    const text = await response.text();
    expect(text).not.toMatch(/service.role/i);
    expect(text).not.toMatch(/bearer\s+\S/i);
    expect(text).not.toContain('r2-secret');
  });

  it('POST /adoptions still routes to adoption create handler (no conflict)', async () => {
    // This test confirms route doesn't intercept the exact adoptionsPath.
    // matchWorkerAdoptionStatusId('/adoptions', '/adoptions') === null,
    // so the exact path falls through to the create handler.
    const result = matchWorkerAdoptionStatusId('/adoptions', '/adoptions');
    expect(result).toBeNull();
  });
});
