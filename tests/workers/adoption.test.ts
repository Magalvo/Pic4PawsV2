import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  AdoptionApplicationRepository,
  AdoptionApplicationPetContext,
  CreateAdoptionApplicationResult,
} from '../../apps/workers/src/index';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { EnvironmentRecord } from '@pic4paws/config';

const validEnv: EnvironmentRecord = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  WORKER_ADOPTIONS_PATH: '/adoptions',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const fakeActor: AuthenticatedActor = {
  id: 'user-adopter-1',
  authUserId: 'auth-adopter-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const fakeAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(fakeActor);

const validPayload = {
  petId: 'pet-pub-1',
  applicantFullName: 'Maria Silva',
  applicantEmail: 'maria@example.pt',
  applicantPhoneNumber: '+351912345678',
  applicantCity: 'Lisboa',
  applicantDistrict: 'Lisboa',
  applicantPostalCode: '1000-001',
  housingType: 'apartment',
  hasOutdoorSpace: false,
  hasChildren: false,
  hasOtherAnimals: false,
  otherAnimalsDescription: null,
  previousPetExperience: 'Tive um gato durante 5 anos.',
  dailyRoutine: 'Trabalho de casa, estou disponível o dia todo.',
  adoptionMotivation: 'Quero dar um lar a um animal que precisa.',
  veterinarianContact: null,
  dataProcessingAccepted: true,
  shelterContactAccepted: true,
  consentVersion: 'v1.0',
  consentAcceptedAt: '2026-06-07T10:00:00.000Z',
};

const petContext: AdoptionApplicationPetContext = {
  petId: 'pet-pub-1',
  shelterId: 'shelter-a',
};

const applicationResult: CreateAdoptionApplicationResult = {
  applicationId: 'app-001',
  submittedAt: '2026-06-07T10:00:00.000Z',
};

const makeAdoptionRepo = (
  context: AdoptionApplicationPetContext | null = petContext,
  result: CreateAdoptionApplicationResult = applicationResult,
): AdoptionApplicationRepository => ({
  loadPetForApplication: vi.fn().mockResolvedValue(context),
  createApplication: vi.fn().mockResolvedValue(result),
});

const makeAdoptionRequest = (body: unknown = validPayload) =>
  new Request('https://workers.pic4paws.pt/adoptions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('POST /adoptions — adoption application', () => {
  it('returns 201 with adoption_application_submitted on valid authenticated request', async () => {
    const repo = makeAdoptionRepo();
    const request = makeAdoptionRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: repo,
      now: () => '2026-06-07T10:00:00.000Z',
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.status).toBe('adoption_application_submitted');
  });

  it('response includes applicationId, petId, shelterId and submittedAt', async () => {
    const repo = makeAdoptionRepo();
    const request = makeAdoptionRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: repo,
      now: () => '2026-06-07T10:00:00.000Z',
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(body.applicationId).toBeTruthy();
    expect(body.petId).toBe('pet-pub-1');
    expect(body.shelterId).toBe('shelter-a');
    expect(body.submittedAt).toBeTruthy();
  });

  it('returns 401 when Authorization header is absent', async () => {
    const repo = makeAdoptionRepo();
    const request = new Request('https://workers.pic4paws.pt/adoptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator returns null', async () => {
    const nullAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(null);
    const repo = makeAdoptionRepo();
    const request = makeAdoptionRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: nullAuth,
      adoptionRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 400 when payload is missing petId', async () => {
    const repo = makeAdoptionRepo();
    const { petId, ...payloadWithoutPetId } = validPayload;
    void petId; // intentionally destructured to produce payload-without-petId
    const request = makeAdoptionRequest(payloadWithoutPetId);

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_adoption_application');
  });

  it('returns 400 when dataProcessingAccepted is false', async () => {
    const repo = makeAdoptionRepo();
    const request = makeAdoptionRequest({ ...validPayload, dataProcessingAccepted: false });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: repo,
    });
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_adoption_application');
    expect(body.reasons).toContain('data_processing_consent_required');
  });

  it('returns 404 when loadPetForApplication returns null', async () => {
    const repo = makeAdoptionRepo(null);
    const request = makeAdoptionRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.status).toBe('pet_not_found');
  });

  it('returns 501 when adoptionRepository is not injected', async () => {
    const request = makeAdoptionRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
    });
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('adoption_repository_not_configured');
  });

  it('returns 405 for GET /adoptions', async () => {
    const request = new Request('https://workers.pic4paws.pt/adoptions', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: makeAdoptionRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
  });

  it('response body never contains credential markers', async () => {
    const repo = makeAdoptionRepo();
    const request = makeAdoptionRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      adoptionRepository: repo,
      now: () => '2026-06-07T10:00:00.000Z',
    });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
