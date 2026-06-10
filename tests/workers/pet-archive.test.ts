import { describe, expect, it } from 'vitest';
import {
  matchWorkerPetArchiveId,
  validatePetArchivePayload,
  handleWorkerPetArchiveRequest,
} from '../../apps/workers/src/pet-archive';
import type {
  PetArchiveRepository,
  PetArchiveRecord,
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

const makeNonMemberActor = (): AuthenticatedActor => ({
  id: 'actor-2',
  authUserId: 'auth-user-2',
  role: 'shelter_member' as const,
  status: 'active' as const,
  memberships: [],
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
  recordLifecycleEvent: async () => undefined,
  getLifecycleEvents: async () => [],
  ...overrides,
});

const makePatchRequest = (body?: Record<string, unknown>, token = 'valid-token'): Request =>
  new Request('https://workers.pic4paws.pt/pets/pet-001/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body ?? { status: 'archived' }),
  });

// ─── matchWorkerPetArchiveId ──────────────────────────────────────────────────

describe('matchWorkerPetArchiveId', () => {
  it('returns petId for /{petFeedPath}/{petId}/status', () => {
    expect(matchWorkerPetArchiveId('/pets/abc123/status', petFeedPath)).toBe('abc123');
  });

  it('returns null for /{petFeedPath}/{petId} (no /status suffix)', () => {
    expect(matchWorkerPetArchiveId('/pets/abc123', petFeedPath)).toBeNull();
  });

  it('returns null for /{petFeedPath}/{petId}/other', () => {
    expect(matchWorkerPetArchiveId('/pets/abc123/other', petFeedPath)).toBeNull();
  });

  it('returns null for /{petFeedPath} (no petId)', () => {
    expect(matchWorkerPetArchiveId('/pets', petFeedPath)).toBeNull();
  });

  it('returns null for wrong base path', () => {
    expect(matchWorkerPetArchiveId('/animals/abc123/status', petFeedPath)).toBeNull();
  });

  it('returns null for /{petFeedPath}/{petId}/status/extra (too many segments)', () => {
    expect(matchWorkerPetArchiveId('/pets/abc123/status/extra', petFeedPath)).toBeNull();
  });
});

// ─── validatePetArchivePayload ────────────────────────────────────────────────

describe('validatePetArchivePayload', () => {
  it('returns "archived" for { status: "archived" }', () => {
    expect(validatePetArchivePayload({ status: 'archived' })).toBe('archived');
  });

  it('returns "published" for { status: "published" }', () => {
    expect(validatePetArchivePayload({ status: 'published' })).toBe('published');
  });

  it('returns null for empty object', () => {
    expect(validatePetArchivePayload({})).toBeNull();
  });

  it('returns null for null payload', () => {
    expect(validatePetArchivePayload(null)).toBeNull();
  });

  it('returns null for non-object payload', () => {
    expect(validatePetArchivePayload('archived')).toBeNull();
  });
});

// ─── handleWorkerPetArchiveRequest ───────────────────────────────────────────

describe('handleWorkerPetArchiveRequest', () => {
  it('returns 405 for non-PATCH method', async () => {
    const request = new Request('https://workers.pic4paws.pt/pets/pet-001/status', {
      method: 'GET',
    });
    const response = await handleWorkerPetArchiveRequest({
      request,
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(405);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 501 when petArchiveRepository is undefined', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: undefined,
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(501);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('pet_archive_repository_not_configured');
  });

  it('returns 501 when authenticator is undefined', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository(),
      authenticator: undefined,
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(501);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when no Authorization header', async () => {
    const request = new Request('https://workers.pic4paws.pt/pets/pet-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    const response = await handleWorkerPetArchiveRequest({
      request,
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(401);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator resolves to null', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(null),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(401);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 400 when payload status is an invalid value', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest({ status: 'draft' }),
      petId: 'pet-001',
      payload: { status: 'draft' },
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(400);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('invalid_payload');
  });

  it('returns 400 when payload is null', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: null,
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(400);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('invalid_payload');
  });

  it('returns 404 when getPetForArchive returns null', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository({ getPetForArchive: async () => null }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(404);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('pet_not_found');
  });

  it('returns 403 when actor is not a member of the pet shelter', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository({
        getPetForArchive: async () => makePetRecord({ shelterId: 'shelter-999' }),
      }),
      authenticator: makeAuthenticator(makeNonMemberActor()),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(403);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('forbidden');
  });

  it('returns 409 when archivePet returns null (already archived)', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository({ archivePet: async () => null }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(409);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('pet_already_archived');
  });

  it('returns 200 with petId on success', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository(),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(body.petId).toBe('pet-001');
  });

  it('passes the now timestamp to archivePet', async () => {
    let capturedNow: string | undefined;
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest(),
      petId: 'pet-001',
      payload: { status: 'archived' },
      petArchiveRepository: makeRepository({
        archivePet: async ({ petId, now }) => {
          capturedNow = now;
          return { petId };
        },
      }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T12:00:00Z',
    });
    expect(response.status).toBe(200);
    expect(capturedNow).toBe('2026-06-08T12:00:00Z');
  });

  it('returns 200 with petId on republish success', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest({ status: 'published' }),
      petId: 'pet-001',
      payload: { status: 'published' },
      petArchiveRepository: makeRepository({
        getPetForArchive: async () => makePetRecord({ lifecycleStatus: 'archived' }),
      }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(body.petId).toBe('pet-001');
  });

  it('returns 409 pet_not_archived when republishPet returns null', async () => {
    const response = await handleWorkerPetArchiveRequest({
      request: makePatchRequest({ status: 'published' }),
      petId: 'pet-001',
      payload: { status: 'published' },
      petArchiveRepository: makeRepository({
        getPetForArchive: async () => makePetRecord({ lifecycleStatus: 'archived' }),
        republishPet: async () => null,
      }),
      authenticator: makeAuthenticator(makeShelterMemberActor('shelter-001')),
      now: '2026-06-08T00:00:00Z',
    });
    expect(response.status).toBe(409);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('pet_not_archived');
  });
});
