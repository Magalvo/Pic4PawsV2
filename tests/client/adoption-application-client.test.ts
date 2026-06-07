import { describe, expect, it, vi } from 'vitest';
import { createAdoptionApplicationClient } from '../../packages/client/src/index';
import type {
  AdoptionApplicationClientInput,
  AdoptionApplicationClientSuccess,
} from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const validToken = 'valid-access-token';

const makeClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(validToken),
) =>
  createAdoptionApplicationClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    adoptionsPath: '/adoptions',
    getAccessToken,
    fetch,
  });

const validInput: AdoptionApplicationClientInput = {
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

const successBody = {
  status: 'adoption_application_submitted',
  applicationId: 'app-001',
  petId: 'pet-pub-1',
  shelterId: 'shelter-a',
  submittedAt: '2026-06-07T10:00:00.000Z',
};

describe('AdoptionApplicationClient contract', () => {
  it('returns adoption_application_submitted on valid 201 response', async () => {
    const fetch = makeFetch(201, successBody);

    const result = await makeClient(fetch).submitApplication(validInput);

    expect(result.ok).toBe(true);
    expect(result.status).toBe('adoption_application_submitted');
  });

  it('response includes applicationId, petId, shelterId and submittedAt', async () => {
    const fetch = makeFetch(201, successBody);

    const result = (await makeClient(fetch).submitApplication(
      validInput,
    )) as AdoptionApplicationClientSuccess;

    expect(result.applicationId).toBe('app-001');
    expect(result.petId).toBe('pet-pub-1');
    expect(result.shelterId).toBe('shelter-a');
    expect(result.submittedAt).toBeTruthy();
  });

  it('calls the adoptionsPath URL directly (not as a sub-path)', async () => {
    const fetch = makeFetch(201, successBody);

    await makeClient(fetch).submitApplication(validInput);

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/adoptions');
  });

  it('sends Authorization header with Bearer token', async () => {
    const fetch = makeFetch(201, successBody);

    await makeClient(fetch).submitApplication(validInput);

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)['Authorization']).toBe(
      `Bearer ${validToken}`,
    );
  });

  it('returns unauthenticated when getAccessToken resolves to null', async () => {
    const fetch = makeFetch(201, successBody);

    const result = await makeClient(fetch, () => Promise.resolve(null)).submitApplication(
      validInput,
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns pet_not_found on 404 response', async () => {
    const fetch = makeFetch(404, { status: 'pet_not_found' });

    const result = await makeClient(fetch).submitApplication(validInput);

    expect(result).toMatchObject({ ok: false, status: 'pet_not_found' });
  });

  it('returns worker_request_failed on non-ok response (503)', async () => {
    const fetch = makeFetch(503, {
      status: 'service_unavailable',
      reasons: ['downstream_error'],
    });

    const result = await makeClient(fetch).submitApplication(validInput);

    expect(result).toMatchObject({ ok: false, status: 'worker_request_failed' });
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).submitApplication(validInput);

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 201 with malformed body', async () => {
    const fetch = makeFetch(201, { status: 'adoption_application_submitted', missingId: true });

    const result = await makeClient(fetch).submitApplication(validInput);

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'server_error',
      reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
    });

    const result = await makeClient(fetch).submitApplication(validInput);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });
});
