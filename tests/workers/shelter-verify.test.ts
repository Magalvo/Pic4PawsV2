import { describe, it, expect } from 'vitest';
import {
  handleWorkerShelterVerifyRequest,
  matchWorkerShelterVerificationId,
  type ShelterVerificationRepository,
  type ShelterVerificationStatus,
} from '../../apps/workers/src/shelter-verify';
import type { AuthenticatedActor } from '@pic4paws/domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRequest = (
  method: string,
  token: string | null = 'valid-token',
): Request =>
  new Request('https://worker.test/shelters/shelter-1/verification', {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const makeActor = (
  overrides: Partial<AuthenticatedActor> = {},
): AuthenticatedActor => ({
  id: 'user-1',
  authUserId: 'auth-1',
  role: 'admin',
  status: 'active',
  memberships: [],
  ...overrides,
});

const makeMemberActor = (shelterId = 'shelter-1'): AuthenticatedActor =>
  makeActor({
    role: 'shelter_owner',
    memberships: [{ id: 'm-1', userId: 'user-1', shelterId, role: 'shelter_owner' }],
  });

const makeRepo = (
  currentStatus: ShelterVerificationStatus | null,
): ShelterVerificationRepository => ({
  loadVerificationStatus: async () => {
    if (currentStatus === null) return null;
    return { currentStatus };
  },
  updateVerificationStatus: async (shelterId) => ({ shelterId }),
});

const makeAuthenticator = (actor: AuthenticatedActor | null) =>
  async () => actor;

// ─── matchWorkerShelterVerificationId ─────────────────────────────────────────

describe('matchWorkerShelterVerificationId', () => {
  it('matches /shelters/:id/verification', () => {
    expect(matchWorkerShelterVerificationId('/shelters/abc-123/verification', '/shelters')).toBe('abc-123');
  });

  it('returns null for /shelters/:id', () => {
    expect(matchWorkerShelterVerificationId('/shelters/abc-123', '/shelters')).toBeNull();
  });

  it('returns null for /shelters/:id/verification/extra', () => {
    expect(matchWorkerShelterVerificationId('/shelters/abc-123/verification/extra', '/shelters')).toBeNull();
  });

  it('returns null for /shelters/:id/members', () => {
    expect(matchWorkerShelterVerificationId('/shelters/abc-123/members', '/shelters')).toBeNull();
  });

  it('returns null for unrelated paths', () => {
    expect(matchWorkerShelterVerificationId('/pets/abc-123/verification', '/shelters')).toBeNull();
  });
});

// ─── handleWorkerShelterVerifyRequest ────────────────────────────────────────

describe('handleWorkerShelterVerifyRequest', () => {
  it('returns 405 for non-PATCH method', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('POST'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(405);
  });

  it('returns 401 when no bearer token', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH', null),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(401);
    expect((await res.json() as { status: string }).status).toBe('unauthenticated');
  });

  it('returns 501 when authenticator not configured', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('pending_review'),
    });
    expect(res.status).toBe(501);
    expect((await res.json() as { status: string }).status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator returns null', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(null),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing status', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'unknown_status' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { status: string; reasons: string[] };
    expect(body.status).toBe('invalid_payload');
    expect(body.reasons).toContain('status_invalid');
  });

  it('returns 400 for non-object body', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: null,
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(400);
  });

  it('returns 403 when non-admin tries to verify', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeMemberActor()),
    });
    expect(res.status).toBe(403);
  });

  it('returns 403 when non-admin tries to reject', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'rejected' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeMemberActor()),
    });
    expect(res.status).toBe(403);
  });

  it('returns 403 when non-admin tries to suspend', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'suspended' },
      shelterVerificationRepository: makeRepo('verified'),
      authenticator: makeAuthenticator(makeMemberActor()),
    });
    expect(res.status).toBe(403);
  });

  it('returns 403 when non-member tries to submit for review', async () => {
    const nonMemberActor = makeActor({ role: 'shelter_owner', memberships: [] });
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'pending_review' },
      shelterVerificationRepository: makeRepo('draft'),
      authenticator: makeAuthenticator(nonMemberActor),
    });
    expect(res.status).toBe(403);
  });

  it('returns 501 when repository not configured', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(501);
    expect((await res.json() as { status: string }).status).toBe('shelter_verification_repository_not_configured');
  });

  it('returns 404 when shelter not found', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo(null),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(404);
  });

  it('returns 422 for disallowed transition (draft → verified)', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('draft'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(422);
    const body = await res.json() as { status: string; reasons: string[] };
    expect(body.status).toBe('invalid_transition');
    expect(body.reasons).toContain('draft_to_verified_not_allowed');
  });

  it('shelter member submits for review (draft → pending_review)', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'pending_review' },
      shelterVerificationRepository: makeRepo('draft'),
      authenticator: makeAuthenticator(makeMemberActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; verificationStatus: string };
    expect(body.status).toBe('updated');
    expect(body.verificationStatus).toBe('pending_review');
  });

  it('admin approves (pending_review → verified)', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; verificationStatus: string };
    expect(body.status).toBe('updated');
    expect(body.verificationStatus).toBe('verified');
  });

  it('admin rejects (pending_review → rejected)', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'rejected' },
      shelterVerificationRepository: makeRepo('pending_review'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { verificationStatus: string };
    expect(body.verificationStatus).toBe('rejected');
  });

  it('shelter resubmits after rejection (rejected → pending_review)', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'pending_review' },
      shelterVerificationRepository: makeRepo('rejected'),
      authenticator: makeAuthenticator(makeMemberActor()),
    });
    expect(res.status).toBe(200);
  });

  it('admin suspends (verified → suspended)', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'suspended' },
      shelterVerificationRepository: makeRepo('verified'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { verificationStatus: string };
    expect(body.verificationStatus).toBe('suspended');
  });

  it('admin unsuspends (suspended → verified)', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'verified' },
      shelterVerificationRepository: makeRepo('suspended'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { verificationStatus: string };
    expect(body.verificationStatus).toBe('verified');
  });

  it('admin can also submit for review on behalf of shelter', async () => {
    const res = await handleWorkerShelterVerifyRequest({
      request: makeRequest('PATCH'),
      shelterId: 'shelter-1',
      payload: { status: 'pending_review' },
      shelterVerificationRepository: makeRepo('draft'),
      authenticator: makeAuthenticator(makeActor()),
    });
    expect(res.status).toBe(200);
  });
});
