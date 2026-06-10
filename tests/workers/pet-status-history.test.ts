import { describe, expect, it, vi } from 'vitest';
import { handleWorkerPetArchiveRequest } from '../../apps/workers/src/pet-archive';
import type {
  PetArchiveRepository,
  PetArchiveRecord,
} from '../../apps/workers/src/pet-archive';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/pet-drafts';
import type { AuthenticatedActor } from '@pic4paws/domain';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeShelterMemberActor = (shelterId: string, actorId = 'actor-1'): AuthenticatedActor => ({
  id: actorId,
  authUserId: 'auth-user-1',
  role: 'shelter_member' as const,
  status: 'active' as const,
  memberships: [{ id: 'membership-1', userId: actorId, shelterId, role: 'shelter_member', deletedAt: null }],
});

const makeAuthenticator = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator =>
  async () => actor;

const makePetRecord = (overrides?: Partial<PetArchiveRecord>): PetArchiveRecord => ({
  petId: 'pet-001',
  shelterId: 'shelter-001',
  lifecycleStatus: 'published',
  ...overrides,
});

const makeRepository = (overrides?: Partial<PetArchiveRepository>): PetArchiveRepository => ({
  getPetForArchive: async () => makePetRecord(),
  archivePet: async ({ petId }) => ({ petId }),
  republishPet: async ({ petId }) => ({ petId }),
  recordLifecycleEvent: vi.fn().mockResolvedValue(undefined),
  getLifecycleEvents: async () => [],
  ...overrides,
});

const makePatchRequest = (body: Record<string, unknown> = { status: 'archived' }): Request =>
  new Request('https://workers.pic4paws.pt/pets/pet-001/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    body: JSON.stringify(body),
  });

// ─── Event recording on success ───────────────────────────────────────────────

describe('pet lifecycle event recording — archive', () => {
  it('calls recordLifecycleEvent with correct params after archive', async () => {
    const recordLifecycleEvent = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepository({ recordLifecycleEvent });

    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest({ status: 'archived' }),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: repo,
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001', 'actor-xyz')),
      now: '2026-06-10T10:00:00Z',
    });

    expect(response.status).toBe(200);
    expect(recordLifecycleEvent).toHaveBeenCalledOnce();
    expect(recordLifecycleEvent).toHaveBeenCalledWith({
      petId: 'pet-001',
      shelterId: 'shelter-001',
      actorUserId: 'actor-xyz',
      fromStatus: 'published',
      toStatus: 'archived',
      now: '2026-06-10T10:00:00Z',
    });
  });

  it('does NOT call recordLifecycleEvent when archivePet returns null (conflict)', async () => {
    const recordLifecycleEvent = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepository({
      archivePet: async () => null,
      recordLifecycleEvent,
    });

    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest({ status: 'archived' }),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: repo,
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-10T10:00:00Z',
    });

    expect(response.status).toBe(409);
    expect(recordLifecycleEvent).not.toHaveBeenCalled();
  });
});

describe('pet lifecycle event recording — republish', () => {
  it('calls recordLifecycleEvent with correct params after republish', async () => {
    const recordLifecycleEvent = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepository({
      getPetForArchive: async () => makePetRecord({ lifecycleStatus: 'archived' }),
      recordLifecycleEvent,
    });

    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest({ status: 'published' }),
      petId: 'pet-001',
      payload: { status: 'published' },
      petArchiveRepository: repo,
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001', 'actor-xyz')),
      now: '2026-06-10T11:00:00Z',
    });

    expect(response.status).toBe(200);
    expect(recordLifecycleEvent).toHaveBeenCalledOnce();
    expect(recordLifecycleEvent).toHaveBeenCalledWith({
      petId: 'pet-001',
      shelterId: 'shelter-001',
      actorUserId: 'actor-xyz',
      fromStatus: 'archived',
      toStatus: 'published',
      now: '2026-06-10T11:00:00Z',
    });
  });

  it('does NOT call recordLifecycleEvent when republishPet returns null (conflict)', async () => {
    const recordLifecycleEvent = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepository({
      getPetForArchive: async () => makePetRecord({ lifecycleStatus: 'archived' }),
      republishPet: async () => null,
      recordLifecycleEvent,
    });

    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest({ status: 'published' }),
      petId: 'pet-001',
      payload: { status: 'published' },
      petArchiveRepository: repo,
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-10T11:00:00Z',
    });

    expect(response.status).toBe(409);
    expect(recordLifecycleEvent).not.toHaveBeenCalled();
  });
});
