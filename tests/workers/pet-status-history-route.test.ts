import { describe, expect, it } from 'vitest';
import {
  matchWorkerPetStatusHistoryId,
  handleWorkerPetStatusHistoryRequest,
} from '../../apps/workers/src/pet-archive';
import type {
  PetArchiveRepository,
  PetArchiveRecord,
  PetLifecycleEvent,
} from '../../apps/workers/src/pet-archive';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/pet-drafts';
import type { AuthenticatedActor } from '@pic4paws/domain';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const petFeedPath = '/pets';

const makeShelterMemberActor = (shelterId: string): AuthenticatedActor => ({
  id: 'actor-1',
  authUserId: 'auth-user-1',
  role: 'shelter_member' as const,
  status: 'active' as const,
  memberships: [{ shelterId, role: 'shelter_member', deletedAt: null }],
});

const makeAuthenticator = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator =>
  async () => actor;

const makePetRecord = (overrides?: Partial<PetArchiveRecord>): PetArchiveRecord => ({
  petId: 'pet-001',
  shelterId: 'shelter-001',
  lifecycleStatus: 'published',
  ...overrides,
});

const makeEvent = (overrides?: Partial<PetLifecycleEvent>): PetLifecycleEvent => ({
  id: 'event-001',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  actorUserId: 'actor-1',
  fromStatus: 'published',
  toStatus: 'archived',
  createdAt: '2026-06-10T10:00:00Z',
  ...overrides,
});

const makeRepository = (overrides?: Partial<PetArchiveRepository>): PetArchiveRepository => ({
  getPetForArchive: async () => makePetRecord(),
  archivePet: async ({ petId }) => ({ petId }),
  republishPet: async ({ petId }) => ({ petId }),
  recordLifecycleEvent: async () => undefined,
  getLifecycleEvents: async () => [],
  ...overrides,
});

const makeGetRequest = (petId = 'pet-001', token = 'valid-token'): Request =>
  new Request(`https://workers.pic4paws.pt/pets/${petId}/status-history`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── matchWorkerPetStatusHistoryId ────────────────────────────────────────────

describe('matchWorkerPetStatusHistoryId', () => {
  it('returns petId for /pets/:petId/status-history', () => {
    expect(matchWorkerPetStatusHistoryId('/pets/abc123/status-history', petFeedPath)).toBe('abc123');
  });

  it('returns null for /pets/:petId/status (archive route — different suffix)', () => {
    expect(matchWorkerPetStatusHistoryId('/pets/abc123/status', petFeedPath)).toBeNull();
  });

  it('returns null for /pets/:petId (no suffix)', () => {
    expect(matchWorkerPetStatusHistoryId('/pets/abc123', petFeedPath)).toBeNull();
  });

  it('returns null for /pets/:petId/status-history/extra (too many segments)', () => {
    expect(matchWorkerPetStatusHistoryId('/pets/abc123/status-history/extra', petFeedPath)).toBeNull();
  });

  it('returns null for wrong base path', () => {
    expect(matchWorkerPetStatusHistoryId('/animals/abc123/status-history', petFeedPath)).toBeNull();
  });
});

// ─── handleWorkerPetStatusHistoryRequest ─────────────────────────────────────

describe('handleWorkerPetStatusHistoryRequest', () => {
  it('returns 405 for non-GET method', async () => {
    const request = new Request('https://workers.pic4paws.pt/pets/pet-001/status-history', {
      method: 'POST',
    });
    const response = await handleWorkerPetStatusHistoryRequest({
      request,
      petId: 'pet-001',
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
    });
    expect(response.status).toBe(405);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 501 when repository is undefined', async () => {
    const response = await handleWorkerPetStatusHistoryRequest({
      request: makeGetRequest(),
      petId: 'pet-001',
      petArchiveRepository: undefined,
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
    });
    expect(response.status).toBe(501);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('pet_archive_repository_not_configured');
  });

  it('returns 501 when authenticator is undefined', async () => {
    const response = await handleWorkerPetStatusHistoryRequest({
      request: makeGetRequest(),
      petId: 'pet-001',
      petArchiveRepository: makeRepository(),
      authenticator: undefined,
    });
    expect(response.status).toBe(501);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when no Authorization header', async () => {
    const request = new Request('https://workers.pic4paws.pt/pets/pet-001/status-history', {
      method: 'GET',
    });
    const response = await handleWorkerPetStatusHistoryRequest({
      request,
      petId: 'pet-001',
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
    });
    expect(response.status).toBe(401);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator resolves null', async () => {
    const response = await handleWorkerPetStatusHistoryRequest({
      request: makeGetRequest(),
      petId: 'pet-001',
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(null),
    });
    expect(response.status).toBe(401);
  });

  it('returns 404 when pet not found', async () => {
    const response = await handleWorkerPetStatusHistoryRequest({
      request: makeGetRequest(),
      petId: 'pet-001',
      petArchiveRepository: makeRepository({ getPetForArchive: async () => null }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
    });
    expect(response.status).toBe(404);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('pet_not_found');
  });

  it('returns 403 when actor is not a member of the pet shelter', async () => {
    const response = await handleWorkerPetStatusHistoryRequest({
      request: makeGetRequest(),
      petId: 'pet-001',
      petArchiveRepository: makeRepository({
        getPetForArchive: async () => makePetRecord({ shelterId: 'shelter-999' }),
      }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
    });
    expect(response.status).toBe(403);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('forbidden');
  });

  it('returns 200 with empty events array when no history', async () => {
    const response = await handleWorkerPetStatusHistoryRequest({
      request: makeGetRequest(),
      petId: 'pet-001',
      petArchiveRepository: makeRepository({ getLifecycleEvents: async () => [] }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
    });
    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(body.petId).toBe('pet-001');
    expect(Array.isArray(body.events)).toBe(true);
    expect((body.events as unknown[]).length).toBe(0);
  });

  it('returns 200 with events in correct shape', async () => {
    const event = makeEvent();
    const response = await handleWorkerPetStatusHistoryRequest({
      request: makeGetRequest(),
      petId: 'pet-001',
      petArchiveRepository: makeRepository({ getLifecycleEvents: async () => [event] }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
    });
    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    const events = body.events as PetLifecycleEvent[];
    expect(events).toHaveLength(1);
    expect(events[0].fromStatus).toBe('published');
    expect(events[0].toStatus).toBe('archived');
    expect(events[0].actorUserId).toBe('actor-1');
    expect(events[0].createdAt).toBe('2026-06-10T10:00:00Z');
  });
});
