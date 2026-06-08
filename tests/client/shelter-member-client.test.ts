import { describe, expect, it, vi } from 'vitest';
import { createShelterMemberClient } from '../../packages/client/src/index';
import type {
  MediaUploadClientFetch,
  ShelterMemberClient,
} from '../../packages/client/src/index';

const workerBaseUrl = 'https://workers.pic4paws.pt';
const shelterPath = '/shelters' as const;

const makeFetch = (
  status: number,
  body: Record<string, unknown>,
): MediaUploadClientFetch =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

const throwingFetch: MediaUploadClientFetch = vi.fn().mockRejectedValue(
  new Error('Network error'),
);

const makeClient = (
  fetch: MediaUploadClientFetch,
  token: string | null = 'valid-token',
): ShelterMemberClient =>
  createShelterMemberClient({
    workerBaseUrl,
    shelterPath,
    getAccessToken: async () => token,
    fetch,
  });

// ─── loadShelterMembers ───────────────────────────────────────────────────────

describe('createShelterMemberClient — loadShelterMembers', () => {
  it('returns unauthenticated when getAccessToken returns null', async () => {
    const client = makeClient(makeFetch(200, {}), null);
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated when getAccessToken returns blank string', async () => {
    const client = makeClient(makeFetch(200, {}), '  ');
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = makeClient(throwingFetch);
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns unauthenticated on 401', async () => {
    const client = makeClient(makeFetch(401, { status: 'unauthenticated' }));
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(makeFetch(403, { status: 'forbidden' }));
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('forbidden');
  });

  it('returns shelter_member_repository_not_configured on 501', async () => {
    const client = makeClient(
      makeFetch(501, { status: 'shelter_member_repository_not_configured' }),
    );
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('shelter_member_repository_not_configured');
  });

  it('returns worker_response_invalid when 200 body is missing members', async () => {
    const client = makeClient(makeFetch(200, { status: 'ok' }));
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_response_invalid');
  });

  it('returns success with member list on valid 200', async () => {
    const client = makeClient(
      makeFetch(200, {
        status: 'ok',
        members: [
          { memberId: 'm-1', userId: 'u-1', role: 'shelter_owner', joinedAt: '2026-01-01T00:00:00Z' },
          { memberId: 'm-2', userId: 'u-2', role: 'shelter_member', joinedAt: '2026-01-02T00:00:00Z' },
        ],
        total: 2,
      }),
    );
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.members).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.members[0].memberId).toBe('m-1');
      expect(result.members[0].role).toBe('shelter_owner');
    }
  });

  it('returns success with empty members list', async () => {
    const client = makeClient(
      makeFetch(200, { status: 'ok', members: [], total: 0 }),
    );
    const result = await client.loadShelterMembers('shelter-001');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.members).toHaveLength(0);
      expect(result.total).toBe(0);
    }
  });

  it('sends GET request to {shelterPath}/{shelterId}/members with Bearer token', async () => {
    const fetchSpy = makeFetch(200, { status: 'ok', members: [], total: 0 });
    const client = makeClient(fetchSpy, 'my-token');
    await client.loadShelterMembers('shelter-abc');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/shelters/shelter-abc/members');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    expect(init.body).toBeUndefined();
  });
});

// ─── addShelterMember ─────────────────────────────────────────────────────────

describe('createShelterMemberClient — addShelterMember', () => {
  it('returns unauthenticated when no token', async () => {
    const client = makeClient(makeFetch(201, {}), null);
    const result = await client.addShelterMember('shelter-001', { userId: 'u-1', role: 'shelter_member' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(makeFetch(403, { status: 'forbidden' }));
    const result = await client.addShelterMember('shelter-001', { userId: 'u-1', role: 'shelter_member' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('forbidden');
  });

  it('returns member_already_exists on 409', async () => {
    const client = makeClient(makeFetch(409, { status: 'member_already_exists' }));
    const result = await client.addShelterMember('shelter-001', { userId: 'u-1', role: 'shelter_member' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('member_already_exists');
  });

  it('returns success with member data on 201', async () => {
    const client = makeClient(
      makeFetch(201, {
        status: 'ok',
        memberId: 'm-new',
        userId: 'u-new',
        role: 'shelter_member',
      }),
    );
    const result = await client.addShelterMember('shelter-001', { userId: 'u-new', role: 'shelter_member' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.memberId).toBe('m-new');
      expect(result.userId).toBe('u-new');
      expect(result.role).toBe('shelter_member');
    }
  });

  it('sends POST request with body to {shelterPath}/{shelterId}/members', async () => {
    const fetchSpy = makeFetch(201, { status: 'ok', memberId: 'm-1', userId: 'u-1', role: 'shelter_member' });
    const client = makeClient(fetchSpy, 'my-token');
    await client.addShelterMember('shelter-abc', { userId: 'u-1', role: 'shelter_member' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/shelters/shelter-abc/members');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    expect(init.body).toBeDefined();
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(parsed.userId).toBe('u-1');
    expect(parsed.role).toBe('shelter_member');
  });
});

// ─── removeShelterMember ──────────────────────────────────────────────────────

describe('createShelterMemberClient — removeShelterMember', () => {
  it('returns unauthenticated when no token', async () => {
    const client = makeClient(makeFetch(200, {}), null);
    const result = await client.removeShelterMember('shelter-001', 'm-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(makeFetch(403, { status: 'forbidden' }));
    const result = await client.removeShelterMember('shelter-001', 'm-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('forbidden');
  });

  it('returns member_not_found on 404', async () => {
    const client = makeClient(makeFetch(404, { status: 'member_not_found' }));
    const result = await client.removeShelterMember('shelter-001', 'm-1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('member_not_found');
  });

  it('returns success with memberId on 200', async () => {
    const client = makeClient(
      makeFetch(200, { status: 'ok', memberId: 'm-1' }),
    );
    const result = await client.removeShelterMember('shelter-001', 'm-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.memberId).toBe('m-1');
    }
  });

  it('sends DELETE request to {shelterPath}/{shelterId}/members/{memberId} without body', async () => {
    const fetchSpy = makeFetch(200, { status: 'ok', memberId: 'm-1' });
    const client = makeClient(fetchSpy, 'my-token');
    await client.removeShelterMember('shelter-xyz', 'm-abc');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/shelters/shelter-xyz/members/m-abc');
    expect(init.method).toBe('DELETE');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    expect(init.body).toBeUndefined();
  });

  it('strips credential markers from failure reasons', async () => {
    const client = makeClient(
      makeFetch(500, {
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    );
    const result = await client.removeShelterMember('shelter-001', 'm-1');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });
});
