import { describe, expect, it, vi } from 'vitest';
import { createShelterPetListClient } from '../../packages/client/src/index';
import type {
  ShelterPetClientSummary,
  ShelterPetListClientSuccess,
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
  createShelterPetListClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    shelterPath: '/shelters',
    getAccessToken,
    fetch: fetch as never,
  });

const samplePet: ShelterPetClientSummary = {
  petId: 'pet-1',
  name: 'Becas',
  species: 'dog',
  status: 'draft',
  heroMediaId: null,
  locationLabel: 'Lisboa',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-10T12:00:00.000Z',
};

const successBody = {
  status: 'ok',
  pets: [samplePet],
  total: 1,
};

describe('createShelterPetListClient', () => {
  it('returns ok with pets and total on valid 200 response', async () => {
    const fetch = makeFetch(200, successBody);
    const result = await makeClient(fetch).loadShelterPets('shelter-a');

    expect(result.ok).toBe(true);
    expect(result.status).toBe('ok');
  });

  it('result includes typed pets array and numeric total', async () => {
    const fetch = makeFetch(200, successBody);
    const result = (await makeClient(fetch).loadShelterPets('shelter-a')) as ShelterPetListClientSuccess;

    expect(Array.isArray(result.pets)).toBe(true);
    expect(result.total).toBe(1);
    expect(result.pets[0]?.petId).toBe('pet-1');
    expect(result.pets[0]?.name).toBe('Becas');
    expect(result.pets[0]?.status).toBe('draft');
  });

  it('constructs URL as {workerBaseUrl}/shelters/{shelterId}/pets', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).loadShelterPets('shelter-a');

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/shelters/shelter-a/pets');
  });

  it('appends limit and offset as query params when provided', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).loadShelterPets('shelter-a', { limit: 10, offset: 20 });

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('offset=20');
  });

  it('sends Authorization header with Bearer token', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).loadShelterPets('shelter-a');

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)['Authorization']).toBe(
      `Bearer ${validToken}`,
    );
  });

  it('returns unauthenticated when getAccessToken resolves to null', async () => {
    const fetch = makeFetch(200, successBody);
    const result = await makeClient(fetch, () => Promise.resolve(null)).loadShelterPets('shelter-a');

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403 response', async () => {
    const fetch = makeFetch(403, { status: 'forbidden' });
    const result = await makeClient(fetch).loadShelterPets('shelter-a');

    expect(result).toMatchObject({ ok: false, status: 'forbidden' });
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));
    const result = await makeClient(fetch).loadShelterPets('shelter-a');

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 200 with malformed body', async () => {
    const fetch = makeFetch(200, { status: 'ok', missingPets: true });
    const result = await makeClient(fetch).loadShelterPets('shelter-a');

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'server_error',
      reasons: ['safe_reason', 'service-role-secret', 'r2_secret key', 'bearer abc123'],
    });

    const result = await makeClient(fetch).loadShelterPets('shelter-a');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
    expect(serialized).not.toContain('bearer abc123');
  });
});
