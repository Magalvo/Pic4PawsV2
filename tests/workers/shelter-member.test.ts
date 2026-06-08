import { describe, expect, it, vi } from 'vitest';
import {
  handleWorkerShelterMemberRequest,
  handleWorkerShelterMemberRemoveRequest,
  matchWorkerShelterMemberShelterId,
  matchWorkerShelterMemberRemoveIds,
  validateAddShelterMemberPayload,
} from '../../apps/workers/src/shelter-member';
import type {
  ShelterMemberRepository,
  ShelterMemberSummary,
} from '../../apps/workers/src/shelter-member';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeRequest = (
  method: string,
  url: string,
  token?: string,
  body?: unknown,
): Request => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const makeAuthenticator = (actor: unknown) => vi.fn().mockResolvedValue(actor);

const makeShelterActor = (shelterId: string) => ({
  id: 'manager-user-id',
  authUserId: 'auth-manager-id',
  role: 'shelter_owner' as const,
  status: 'active' as const,
  memberships: [
    {
      id: 'membership-001',
      userId: 'manager-user-id',
      shelterId,
      role: 'shelter_owner' as const,
      deletedAt: null,
    },
  ],
});

const makeOutsiderActor = () => ({
  id: 'outsider-id',
  authUserId: 'auth-outsider-id',
  role: 'adopter' as const,
  status: 'active' as const,
  memberships: [],
});

const makeMembers = (): ShelterMemberSummary[] => [
  { memberId: 'member-001', userId: 'user-001', role: 'shelter_owner', joinedAt: '2026-01-01T00:00:00Z' },
  { memberId: 'member-002', userId: 'user-002', role: 'shelter_member', joinedAt: '2026-01-02T00:00:00Z' },
];

const makeListRepo = (
  members: ShelterMemberSummary[] = makeMembers(),
): ShelterMemberRepository => ({
  listMembers: vi.fn().mockResolvedValue({ members, total: members.length }),
  addMember: vi.fn().mockResolvedValue(null),
  removeMember: vi.fn().mockResolvedValue(null),
});

const makeAddRepo = (
  result: { memberId: string; userId: string; role: 'shelter_owner' | 'shelter_member' } | null,
): ShelterMemberRepository => ({
  listMembers: vi.fn().mockResolvedValue({ members: [], total: 0 }),
  addMember: vi.fn().mockResolvedValue(result),
  removeMember: vi.fn().mockResolvedValue(null),
});

const makeRemoveRepo = (
  result: { memberId: string } | null,
): ShelterMemberRepository => ({
  listMembers: vi.fn().mockResolvedValue({ members: [], total: 0 }),
  addMember: vi.fn().mockResolvedValue(null),
  removeMember: vi.fn().mockResolvedValue(result),
});

// ─── matchWorkerShelterMemberShelterId ────────────────────────────────────────

describe('matchWorkerShelterMemberShelterId', () => {
  it('extracts shelterId from /shelters/:shelterId/members', () => {
    expect(matchWorkerShelterMemberShelterId('/shelters/shelter-abc/members', '/shelters')).toBe('shelter-abc');
  });

  it('returns null for exact /shelters path (no sub-segment)', () => {
    expect(matchWorkerShelterMemberShelterId('/shelters', '/shelters')).toBeNull();
  });

  it('returns null for /shelters/:shelterId (no /members suffix)', () => {
    expect(matchWorkerShelterMemberShelterId('/shelters/shelter-abc', '/shelters')).toBeNull();
  });

  it('returns null for /shelters/:shelterId/members/:memberId (extra segment)', () => {
    expect(matchWorkerShelterMemberShelterId('/shelters/shelter-abc/members/member-123', '/shelters')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchWorkerShelterMemberShelterId('/other/shelter-abc/members', '/shelters')).toBeNull();
  });
});

// ─── matchWorkerShelterMemberRemoveIds ────────────────────────────────────────

describe('matchWorkerShelterMemberRemoveIds', () => {
  it('extracts shelterId and memberId from /shelters/:shelterId/members/:memberId', () => {
    const result = matchWorkerShelterMemberRemoveIds('/shelters/shelter-abc/members/member-123', '/shelters');
    expect(result).toEqual({ shelterId: 'shelter-abc', memberId: 'member-123' });
  });

  it('returns null for /shelters/:shelterId/members (no memberId)', () => {
    expect(matchWorkerShelterMemberRemoveIds('/shelters/shelter-abc/members', '/shelters')).toBeNull();
  });

  it('returns null for path with extra segments', () => {
    expect(matchWorkerShelterMemberRemoveIds('/shelters/shelter-abc/members/m-1/extra', '/shelters')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchWorkerShelterMemberRemoveIds('/other/shelter-abc/members/m-1', '/shelters')).toBeNull();
  });
});

// ─── validateAddShelterMemberPayload ─────────────────────────────────────────

describe('validateAddShelterMemberPayload', () => {
  it('accepts valid payload with shelter_member role', () => {
    expect(validateAddShelterMemberPayload({ userId: 'user-001', role: 'shelter_member' }))
      .toEqual({ userId: 'user-001', role: 'shelter_member' });
  });

  it('accepts valid payload with shelter_owner role', () => {
    expect(validateAddShelterMemberPayload({ userId: 'user-001', role: 'shelter_owner' }))
      .toEqual({ userId: 'user-001', role: 'shelter_owner' });
  });

  it('returns null for missing userId', () => {
    expect(validateAddShelterMemberPayload({ role: 'shelter_member' })).toBeNull();
  });

  it('returns null for missing role', () => {
    expect(validateAddShelterMemberPayload({ userId: 'user-001' })).toBeNull();
  });

  it('returns null for invalid role', () => {
    expect(validateAddShelterMemberPayload({ userId: 'user-001', role: 'adopter' })).toBeNull();
  });

  it('returns null for non-object payload', () => {
    expect(validateAddShelterMemberPayload('not-an-object')).toBeNull();
    expect(validateAddShelterMemberPayload(null)).toBeNull();
  });
});

// ─── handleWorkerShelterMemberRequest — GET (list) ────────────────────────────

describe('handleWorkerShelterMemberRequest — GET', () => {
  it('returns 401 when no bearer token', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members');
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeListRepo(),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(401);
  });

  it('returns 501 when authenticator not configured', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members', 'token');
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeListRepo(),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(501);
  });

  it('returns 401 when token resolves to null', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members', 'bad-token');
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeListRepo(),
      authenticator: makeAuthenticator(null),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 when actor is not a shelter member', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members', 'token');
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeListRepo(),
      authenticator: makeAuthenticator(makeOutsiderActor()),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(403);
  });

  it('returns 501 when repository not configured', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members', 'token');
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(501);
  });

  it('returns 200 with member list on success', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members', 'token');
    const repo = makeListRepo();
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: repo,
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; members: unknown[]; total: number };
    expect(body.status).toBe('ok');
    expect(Array.isArray(body.members)).toBe(true);
    expect(body.total).toBe(2);
  });

  it('returns 200 with empty list when no members', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members', 'token');
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeListRepo([]),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; members: unknown[]; total: number };
    expect(body.members).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('returns 405 for non-GET/POST method', async () => {
    const req = makeRequest('PUT', 'https://worker.test/shelters/s-1/members', 'token');
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeListRepo(),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(405);
  });
});

// ─── handleWorkerShelterMemberRequest — POST (add) ────────────────────────────

describe('handleWorkerShelterMemberRequest — POST', () => {
  it('returns 400 for invalid payload', async () => {
    const req = makeRequest('POST', 'https://worker.test/shelters/s-1/members', 'token', { role: 'shelter_member' });
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeAddRepo({ memberId: 'm-1', userId: 'u-1', role: 'shelter_member' }),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(400);
  });

  it('returns 409 when addMember returns null (already a member)', async () => {
    const req = makeRequest('POST', 'https://worker.test/shelters/s-1/members', 'token', { userId: 'u-1', role: 'shelter_member' });
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeAddRepo(null),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(409);
  });

  it('returns 201 with member data on success', async () => {
    const req = makeRequest('POST', 'https://worker.test/shelters/s-1/members', 'token', { userId: 'u-new', role: 'shelter_member' });
    const res = await handleWorkerShelterMemberRequest({
      request: req,
      shelterId: 's-1',
      shelterMemberRepository: makeAddRepo({ memberId: 'm-new', userId: 'u-new', role: 'shelter_member' }),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
      now: '2026-01-01T00:00:00Z',
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { status: string; memberId: string; userId: string; role: string };
    expect(body.status).toBe('ok');
    expect(body.memberId).toBe('m-new');
    expect(body.userId).toBe('u-new');
    expect(body.role).toBe('shelter_member');
  });
});

// ─── handleWorkerShelterMemberRemoveRequest — DELETE ─────────────────────────

describe('handleWorkerShelterMemberRemoveRequest', () => {
  it('returns 401 when no bearer token', async () => {
    const req = makeRequest('DELETE', 'https://worker.test/shelters/s-1/members/m-1');
    const res = await handleWorkerShelterMemberRemoveRequest({
      request: req,
      shelterId: 's-1',
      memberId: 'm-1',
      shelterMemberRepository: makeRemoveRepo({ memberId: 'm-1' }),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 when actor is not a shelter member', async () => {
    const req = makeRequest('DELETE', 'https://worker.test/shelters/s-1/members/m-1', 'token');
    const res = await handleWorkerShelterMemberRemoveRequest({
      request: req,
      shelterId: 's-1',
      memberId: 'm-1',
      shelterMemberRepository: makeRemoveRepo({ memberId: 'm-1' }),
      authenticator: makeAuthenticator(makeOutsiderActor()),
    });
    expect(res.status).toBe(403);
  });

  it('returns 501 when repository not configured', async () => {
    const req = makeRequest('DELETE', 'https://worker.test/shelters/s-1/members/m-1', 'token');
    const res = await handleWorkerShelterMemberRemoveRequest({
      request: req,
      shelterId: 's-1',
      memberId: 'm-1',
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
    });
    expect(res.status).toBe(501);
  });

  it('returns 404 when removeMember returns null (not found)', async () => {
    const req = makeRequest('DELETE', 'https://worker.test/shelters/s-1/members/m-1', 'token');
    const res = await handleWorkerShelterMemberRemoveRequest({
      request: req,
      shelterId: 's-1',
      memberId: 'm-1',
      shelterMemberRepository: makeRemoveRepo(null),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
    });
    expect(res.status).toBe(404);
  });

  it('returns 200 with memberId on success', async () => {
    const req = makeRequest('DELETE', 'https://worker.test/shelters/s-1/members/m-1', 'token');
    const res = await handleWorkerShelterMemberRemoveRequest({
      request: req,
      shelterId: 's-1',
      memberId: 'm-1',
      shelterMemberRepository: makeRemoveRepo({ memberId: 'm-1' }),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; memberId: string };
    expect(body.status).toBe('ok');
    expect(body.memberId).toBe('m-1');
  });

  it('returns 405 for non-DELETE method', async () => {
    const req = makeRequest('GET', 'https://worker.test/shelters/s-1/members/m-1', 'token');
    const res = await handleWorkerShelterMemberRemoveRequest({
      request: req,
      shelterId: 's-1',
      memberId: 'm-1',
      shelterMemberRepository: makeRemoveRepo({ memberId: 'm-1' }),
      authenticator: makeAuthenticator(makeShelterActor('s-1')),
    });
    expect(res.status).toBe(405);
  });
});
