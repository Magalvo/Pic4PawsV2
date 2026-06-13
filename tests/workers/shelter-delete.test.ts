import { describe, expect, it } from 'vitest';
import { handleWorkerShelterDeleteRequest } from '../../apps/workers/src/shelter-delete';
import type { ShelterDeletionRepository } from '../../apps/workers/src/shelter-delete';
import type { AuthenticatedActor } from '@pic4paws/domain';

const makeOwner = (
  userId = 'user-1',
  shelterId = 'shelter-a',
): AuthenticatedActor => ({
  id: userId,
  authUserId: `auth-${userId}`,
  role: 'shelter_owner',
  status: 'active',
  memberships: [
    { id: 'membership-1', userId, shelterId, role: 'shelter_owner', deletedAt: null },
  ],
});

const makeMember = (
  userId = 'user-2',
  shelterId = 'shelter-a',
): AuthenticatedActor => ({
  id: userId,
  authUserId: `auth-${userId}`,
  role: 'shelter_member',
  status: 'active',
  memberships: [
    { id: 'membership-2', userId, shelterId, role: 'shelter_member', deletedAt: null },
  ],
});

const makeAuth = (actor: AuthenticatedActor | null = makeOwner()) =>
  async () => actor;

const makeRepo = (
  result: { shelterId: string } | null = { shelterId: 'shelter-a' },
): ShelterDeletionRepository => ({
  deleteShelter: async () => result,
});

const baseRequest = (method = 'DELETE', token: string | null = 'valid-token') =>
  new Request('https://worker.test/shelters/shelter-a', {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

describe('handleWorkerShelterDeleteRequest', () => {
  it('returns 405 for non-DELETE methods', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest('GET'),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo(),
      authenticator: makeAuth(),
    });

    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.status).toBe('method_not_allowed');
    expect(body.allowedMethods).toEqual(['DELETE']);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest('DELETE', null),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo(),
      authenticator: makeAuth(),
    });

    expect(response.status).toBe(401);
    expect((await response.json()).status).toBe('unauthenticated');
  });

  it('returns 501 when authenticator is not configured', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo(),
    });

    expect(response.status).toBe(501);
    expect((await response.json()).status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authentication fails', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo(),
      authenticator: makeAuth(null),
    });

    expect(response.status).toBe(401);
    expect((await response.json()).status).toBe('unauthenticated');
  });

  it('returns 403 when actor is a shelter member (not owner)', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo(),
      authenticator: makeAuth(makeMember()),
    });

    expect(response.status).toBe(403);
    expect((await response.json()).status).toBe('forbidden');
  });

  it('returns 403 when actor has no membership in the shelter', async () => {
    const actorWithOtherShelter: AuthenticatedActor = {
      ...makeOwner(),
      memberships: [
        { id: 'm1', userId: 'user-1', shelterId: 'shelter-other', role: 'shelter_owner', deletedAt: null },
      ],
    };

    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo(),
      authenticator: async () => actorWithOtherShelter,
    });

    expect(response.status).toBe(403);
    expect((await response.json()).status).toBe('forbidden');
  });

  it('returns 501 when shelterDeletionRepository is not configured', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
    });

    expect(response.status).toBe(501);
    expect((await response.json()).status).toBe('shelter_deletion_repository_not_configured');
  });

  it('returns 404 when repository returns null (shelter not found)', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo(null),
      authenticator: makeAuth(),
    });

    expect(response.status).toBe(404);
    expect((await response.json()).status).toBe('shelter_not_found');
  });

  it('returns 200 with deleted status and shelterId on success', async () => {
    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo({ shelterId: 'shelter-a' }),
      authenticator: makeAuth(),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: 'deleted', shelterId: 'shelter-a' });
  });

  it('allows admin role to delete any shelter', async () => {
    const admin: AuthenticatedActor = {
      id: 'admin-1',
      authUserId: 'auth-admin-1',
      role: 'admin',
      status: 'active',
      memberships: [],
    };

    const response = await handleWorkerShelterDeleteRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      shelterDeletionRepository: makeRepo({ shelterId: 'shelter-a' }),
      authenticator: async () => admin,
    });

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('deleted');
  });
});
