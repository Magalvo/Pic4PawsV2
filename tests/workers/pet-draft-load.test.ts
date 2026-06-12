import { describe, expect, it } from 'vitest';
import {
  handleWorkerPetDraftLoadRequest,
  type PetDraftRepository,
  type PetDraftLoadRecord,
  type WorkerPetDraftAuthenticator,
} from '../../apps/workers/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';

const shelterMember: AuthenticatedActor = {
  id: 'member-user',
  authUserId: 'auth-member',
  role: 'shelter_member',
  status: 'active',
  memberships: [
    {
      id: 'membership-1',
      userId: 'member-user',
      shelterId: 'shelter-a',
      role: 'shelter_member',
      deletedAt: null,
    },
  ],
};

const otherMember: AuthenticatedActor = {
  id: 'other-user',
  authUserId: 'auth-other',
  role: 'shelter_member',
  status: 'active',
  memberships: [
    {
      id: 'membership-2',
      userId: 'other-user',
      shelterId: 'shelter-b',
      role: 'shelter_member',
      deletedAt: null,
    },
  ],
};

const draftRecord: PetDraftLoadRecord = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  status: 'draft',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo e sociável.',
  mediaIds: ['media-1'],
  heroMediaId: 'media-1',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
  },
  publishedAt: null,
  createdAt: '2026-06-10T12:00:00.000Z',
  updatedAt: '2026-06-10T12:00:00.000Z',
};

const makeRequest = (petId: string, method = 'GET', token: string | null = 'test-token') => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return new Request(`https://worker.pic4paws.pt/pets/drafts/${petId}`, { method, headers });
};

const authenticatorFor = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator =>
  async ({ bearerToken }) => {
    expect(bearerToken).toBe('test-token');
    return actor;
  };

const repositoryWith = (draft: PetDraftLoadRecord | null): PetDraftRepository => ({
  loadMediaAssets: async () => [],
  loadDraft: async () => draft,
  createDraft: async () => ({ petId: 'pet-1' }),
  updateDraft: async (petId) => ({ petId }),
});

describe('handleWorkerPetDraftLoadRequest', () => {
  it('returns 405 for non-GET methods', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-1', 'POST'),
      petId: 'pet-1',
      petDraftRepository: repositoryWith(draftRecord),
      authenticator: authenticatorFor(shelterMember),
    });

    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'method_not_allowed' });
    expect(response.headers.get('Allow')).toBe('GET');
  });

  it('returns 401 when no Authorization header', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-1', 'GET', null),
      petId: 'pet-1',
      petDraftRepository: repositoryWith(draftRecord),
      authenticator: authenticatorFor(shelterMember),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'unauthenticated' });
  });

  it('returns 501 when no authenticator configured', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-1'),
      petId: 'pet-1',
      petDraftRepository: repositoryWith(draftRecord),
    });

    expect(response.status).toBe(501);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'auth_adapter_not_configured' });
  });

  it('returns 401 when authenticator rejects token', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-1'),
      petId: 'pet-1',
      petDraftRepository: repositoryWith(draftRecord),
      authenticator: authenticatorFor(null),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'unauthenticated' });
  });

  it('returns 501 when no petDraftRepository configured', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-1'),
      petId: 'pet-1',
      authenticator: authenticatorFor(shelterMember),
    });

    expect(response.status).toBe(501);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'pet_draft_repository_not_configured' });
  });

  it('returns 404 when draft does not exist', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-unknown'),
      petId: 'pet-unknown',
      petDraftRepository: repositoryWith(null),
      authenticator: authenticatorFor(shelterMember),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'pet_draft_not_found' });
  });

  it('returns 403 when actor does not manage the draft shelter', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-1'),
      petId: 'pet-1',
      petDraftRepository: repositoryWith(draftRecord),
      authenticator: authenticatorFor(otherMember),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'forbidden' });
  });

  it('returns 200 with full draft payload on success', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-1'),
      petId: 'pet-1',
      petDraftRepository: repositoryWith(draftRecord),
      authenticator: authenticatorFor(shelterMember),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      status: 'ok',
      draft: {
        petId: 'pet-1',
        shelterId: 'shelter-a',
        status: 'draft',
        name: 'Becas',
        species: 'dog',
        locationLabel: 'Lisboa',
        shortDescription: 'Calmo e sociável.',
        mediaIds: ['media-1'],
        heroMediaId: 'media-1',
        medical: {
          vaccinated: true,
          sterilized: true,
          microchipped: true,
          specialNeeds: false,
        },
        publishedAt: null,
        createdAt: '2026-06-10T12:00:00.000Z',
        updatedAt: '2026-06-10T12:00:00.000Z',
      },
    });
    expect(JSON.stringify(body)).not.toContain('service-role');
    expect(JSON.stringify(body)).not.toContain('bearer ');
  });

  it('does not expose shelterId check timing before 404 check', async () => {
    const response = await handleWorkerPetDraftLoadRequest({
      request: makeRequest('pet-unknown'),
      petId: 'pet-unknown',
      petDraftRepository: repositoryWith(null),
      authenticator: authenticatorFor(otherMember),
    });

    expect(response.status).toBe(404);
  });
});
