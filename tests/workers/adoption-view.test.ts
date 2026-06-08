import { describe, expect, it } from 'vitest';
import {
  handleWorkerAdoptionViewRequest,
} from '../../apps/workers/src/adoption-view';
import type {
  AdoptionViewRepository,
  AdoptionViewRecord,
} from '../../apps/workers/src/adoption-view';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/pet-drafts';
import type { AuthenticatedActor } from '@pic4paws/domain';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const baseUrl = 'https://workers.pic4paws.pt';

const makeGetRequest = (applicationId = 'app-001'): Request =>
  new Request(`${baseUrl}/adoptions/${applicationId}`, { method: 'GET', headers: { Authorization: 'Bearer valid-token' } });

const makeNonGetRequest = (method: string): Request =>
  new Request(`${baseUrl}/adoptions/app-001`, { method, headers: { Authorization: 'Bearer valid-token' } });

const makeApplicantActor = (userId = 'user-001'): AuthenticatedActor => ({
  id: userId,
  authUserId: `auth-${userId}`,
  role: 'adopter',
  status: 'active',
  memberships: [],
});

const makeShelterActor = (shelterId = 'shelter-001'): AuthenticatedActor => ({
  id: 'shelter-user-001',
  authUserId: 'auth-shelter-user',
  role: 'shelter_owner',
  status: 'active',
  memberships: [
    {
      id: 'membership-001',
      userId: 'shelter-user-001',
      shelterId,
      role: 'shelter_owner',
      deletedAt: null,
    },
  ],
});

const makeRecord = (overrides?: Partial<AdoptionViewRecord>): AdoptionViewRecord => ({
  applicationId: 'app-001',
  shelterId: 'shelter-001',
  applicantUserId: 'user-001',
  petId: 'pet-001',
  applicationStatus: 'submitted',
  ...overrides,
});

const makeRepo = (record: AdoptionViewRecord | null = makeRecord()): AdoptionViewRepository => ({
  getAdoptionView: async () => record,
});

const makeAuthenticator = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator =>
  async () => actor;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handleWorkerAdoptionViewRequest', () => {
  it('returns 405 for POST', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeNonGetRequest('POST'),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(),
      authenticator: makeAuthenticator(makeApplicantActor()),
    });
    expect(res.status).toBe(405);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 405 for PATCH', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeNonGetRequest('PATCH'),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(),
      authenticator: makeAuthenticator(makeApplicantActor()),
    });
    expect(res.status).toBe(405);
  });

  it('returns 401 when no Authorization header', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: new Request(`${baseUrl}/adoptions/app-001`, { method: 'GET' }),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(),
      authenticator: makeAuthenticator(makeApplicantActor()),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no authenticator configured', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(),
    });
    expect(res.status).toBe(501);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authentication fails', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(),
      authenticator: makeAuthenticator(null),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no repository configured', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      authenticator: makeAuthenticator(makeApplicantActor()),
    });
    expect(res.status).toBe(501);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('adoption_view_repository_not_configured');
  });

  it('returns 404 when adoption not found', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-404',
      adoptionViewRepository: makeRepo(null),
      authenticator: makeAuthenticator(makeApplicantActor()),
    });
    expect(res.status).toBe(404);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('adoption_not_found');
  });

  it('returns 403 when actor is neither applicant nor shelter member', async () => {
    const otherActor: AuthenticatedActor = {
      id: 'other-user',
      authUserId: 'auth-other',
      role: 'adopter',
      status: 'active',
      memberships: [],
    };
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(), // applicantUserId = 'user-001', shelterId = 'shelter-001'
      authenticator: makeAuthenticator(otherActor),
    });
    expect(res.status).toBe(403);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('forbidden');
  });

  it('returns 200 for the applicant (adopter viewing their own application)', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest('app-001'),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(makeRecord({ applicantUserId: 'user-001' })),
      authenticator: makeAuthenticator(makeApplicantActor('user-001')),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; applicationId: string; applicationStatus: string };
    expect(body.status).toBe('ok');
    expect(body.applicationId).toBe('app-001');
    expect(body.applicationStatus).toBe('submitted');
  });

  it('returns 200 for a shelter member viewing their shelter\'s application', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest('app-001'),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(makeRecord({ shelterId: 'shelter-001' })),
      authenticator: makeAuthenticator(makeShelterActor('shelter-001')),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('200 response does NOT expose applicantUserId', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(),
      authenticator: makeAuthenticator(makeApplicantActor('user-001')),
    });
    const body = await res.json() as Record<string, unknown>;
    expect(body).not.toHaveProperty('applicantUserId');
  });

  it('200 response includes applicationStatus, shelterId, petId', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(makeRecord({
        applicationStatus: 'approved',
        shelterId: 'shelter-xyz',
        petId: 'pet-xyz',
      })),
      authenticator: makeAuthenticator(makeApplicantActor('user-001')),
    });
    const body = await res.json() as Record<string, unknown>;
    expect(body['applicationStatus']).toBe('approved');
    expect(body['shelterId']).toBe('shelter-xyz');
    expect(body['petId']).toBe('pet-xyz');
  });

  it('returns 200 for shelter member even when different from applicant', async () => {
    const shelterActor = makeShelterActor('shelter-001');
    const record = makeRecord({ applicantUserId: 'some-adopter', shelterId: 'shelter-001' });
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(record),
      authenticator: makeAuthenticator(shelterActor),
    });
    expect(res.status).toBe(200);
  });

  it('returns 200 with null petId when no pet is linked', async () => {
    const res = await handleWorkerAdoptionViewRequest({
      request: makeGetRequest(),
      applicationId: 'app-001',
      adoptionViewRepository: makeRepo(makeRecord({ petId: null })),
      authenticator: makeAuthenticator(makeApplicantActor('user-001')),
    });
    const body = await res.json() as Record<string, unknown>;
    expect(body['petId']).toBeNull();
  });
});
