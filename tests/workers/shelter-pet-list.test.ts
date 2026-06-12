import { describe, expect, it } from 'vitest';
import {
  handleWorkerShelterPetListRequest,
  matchWorkerShelterPetsShelterId,
} from '../../apps/workers/src/shelter-pet-list';
import type {
  ShelterPetListRepository,
  ShelterPetSummary,
} from '../../apps/workers/src/shelter-pet-list';
import type { AuthenticatedActor } from '@pic4paws/domain';

const makeActor = (userId = 'user-1', shelterId = 'shelter-a'): AuthenticatedActor => ({
  id: userId,
  authUserId: `auth-${userId}`,
  role: 'shelter_member',
  status: 'active',
  memberships: [
    { id: 'membership-1', userId, shelterId, role: 'shelter_member', deletedAt: null },
  ],
});

const makeAuth = (actor: AuthenticatedActor | null = makeActor()) =>
  async () => actor;

const makePet = (overrides: Partial<ShelterPetSummary> = {}): ShelterPetSummary => ({
  petId: 'pet-1',
  name: 'Becas',
  species: 'dog',
  status: 'draft',
  heroMediaId: null,
  locationLabel: 'Lisboa',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  ...overrides,
});

const makeRepo = (
  result: { pets: ShelterPetSummary[]; total: number } = { pets: [], total: 0 },
): ShelterPetListRepository => ({
  listPets: async () => result,
});

const baseRequest = (
  method = 'GET',
  token: string | null = 'valid-token',
  url = 'https://worker.test/shelters/shelter-a/pets',
) =>
  new Request(url, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

describe('matchWorkerShelterPetsShelterId', () => {
  it('extracts shelterId from /shelters/:shelterId/pets', () => {
    expect(matchWorkerShelterPetsShelterId('/shelters/abc123/pets', '/shelters')).toBe('abc123');
  });

  it('returns null when /pets suffix is missing', () => {
    expect(matchWorkerShelterPetsShelterId('/shelters/abc123', '/shelters')).toBeNull();
  });

  it('returns null for extra segments after /pets', () => {
    expect(matchWorkerShelterPetsShelterId('/shelters/abc123/pets/extra', '/shelters')).toBeNull();
  });

  it('returns null when shelterId contains a slash', () => {
    expect(matchWorkerShelterPetsShelterId('/shelters/abc/def/pets', '/shelters')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchWorkerShelterPetsShelterId('/other/abc123/pets', '/shelters')).toBeNull();
  });

  it('returns null for just the shelter path', () => {
    expect(matchWorkerShelterPetsShelterId('/shelters', '/shelters')).toBeNull();
  });

  it('does not match /shelters/:id (no /pets)', () => {
    expect(matchWorkerShelterPetsShelterId('/shelters/abc123/adoptions', '/shelters')).toBeNull();
  });
});

describe('handleWorkerShelterPetListRequest', () => {
  it('returns 405 for non-GET requests', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest('POST'),
      shelterId: 'shelter-a',
    });
    expect(response.status).toBe(405);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('method_not_allowed');
    expect(body.allowedMethods).toContain('GET');
  });

  it('returns 401 when no bearer token present', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest('GET', null),
      shelterId: 'shelter-a',
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ status: 'unauthenticated' });
  });

  it('returns 501 when authenticator is not configured', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
    });
    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({ status: 'auth_adapter_not_configured' });
  });

  it('returns 401 when authenticator returns null', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      authenticator: makeAuth(null),
    });
    expect(response.status).toBe(401);
  });

  it('returns 403 when actor is not a member of the target shelter', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'other-shelter',
      authenticator: makeAuth(makeActor('user-1', 'shelter-a')),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ status: 'forbidden' });
  });

  it('returns 501 when repository is not configured', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
    });
    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({
      status: 'shelter_pet_list_repository_not_configured',
    });
  });

  it('returns 200 with empty list when shelter has no pets', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
      shelterPetListRepository: makeRepo({ pets: [], total: 0 }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', pets: [], total: 0 });
  });

  it('returns 200 with mapped pets and passes shelterId + pagination to repository', async () => {
    const calls: Parameters<ShelterPetListRepository['listPets']>[0][] = [];
    const pet = makePet();

    const response = await handleWorkerShelterPetListRequest({
      request: new Request('https://worker.test/shelters/shelter-a/pets?limit=10&offset=5', {
        headers: { Authorization: 'Bearer tok' },
      }),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
      shelterPetListRepository: {
        listPets: async (q) => {
          calls.push(q);
          return { pets: [pet], total: 1 };
        },
      },
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; pets: ShelterPetSummary[]; total: number };
    expect(body.status).toBe('ok');
    expect(body.pets).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(calls[0]).toEqual({ shelterId: 'shelter-a', limit: 10, offset: 5 });
  });

  it('clamps limit to max 100', async () => {
    const calls: Parameters<ShelterPetListRepository['listPets']>[0][] = [];

    await handleWorkerShelterPetListRequest({
      request: new Request('https://worker.test/shelters/shelter-a/pets?limit=999', {
        headers: { Authorization: 'Bearer tok' },
      }),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
      shelterPetListRepository: {
        listPets: async (q) => {
          calls.push(q);
          return { pets: [], total: 0 };
        },
      },
    });

    expect(calls[0]?.limit).toBe(100);
  });

  it('defaults limit to 20 and offset to 0 when params absent', async () => {
    const calls: Parameters<ShelterPetListRepository['listPets']>[0][] = [];

    await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
      shelterPetListRepository: {
        listPets: async (q) => {
          calls.push(q);
          return { pets: [], total: 0 };
        },
      },
    });

    expect(calls[0]).toEqual({ shelterId: 'shelter-a', limit: 20, offset: 0 });
  });

  it('200 response does not contain service-role or bearer secrets', async () => {
    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
      shelterPetListRepository: makeRepo({ pets: [makePet()], total: 1 }),
    });

    const body = JSON.stringify(await response.json());
    expect(body).not.toContain('service-role');
    expect(body).not.toContain('bearer');
  });

  it('returns pets with all statuses — draft, published, archived', async () => {
    const pets = [
      makePet({ status: 'draft' }),
      makePet({ petId: 'pet-2', status: 'published' }),
      makePet({ petId: 'pet-3', status: 'archived' }),
    ];

    const response = await handleWorkerShelterPetListRequest({
      request: baseRequest(),
      shelterId: 'shelter-a',
      authenticator: makeAuth(),
      shelterPetListRepository: makeRepo({ pets, total: 3 }),
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { pets: ShelterPetSummary[] };
    expect(body.pets.map((p) => p.status)).toEqual(['draft', 'published', 'archived']);
  });
});
