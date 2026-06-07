import { describe, expect, it, vi } from 'vitest';
import { createPetProfileClient } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const samplePet = {
  id: 'pet-pub-1',
  shelterId: 'shelter-a',
  name: 'Bobi',
  species: 'dog' as const,
  locationLabel: 'Porto',
  shortDescription: 'Amigável e brincalhão.',
  heroMediaId: 'media-1',
  mediaIds: ['media-1', 'media-2'],
  publishedAt: '2026-06-01T10:00:00.000Z',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
    publicNotes: null,
  },
};

const makeClient = (fetch: ReturnType<typeof vi.fn>) =>
  createPetProfileClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    petFeedPath: '/pets',
    fetch,
  });

describe('PetProfileClient contract', () => {
  it('returns success with pet on 200 response', async () => {
    const fetch = makeFetch(200, { status: 'ok', pet: samplePet });

    const result = await makeClient(fetch).loadProfile('pet-pub-1');

    expect(result).toEqual({ ok: true, status: 'ok', pet: samplePet });
  });

  it('includes the medical field in the returned pet', async () => {
    const fetch = makeFetch(200, { status: 'ok', pet: samplePet });

    const result = await makeClient(fetch).loadProfile('pet-pub-1');

    expect(result.ok && result.pet.medical).toEqual(samplePet.medical);
  });

  it('constructs the URL as petFeedPath/petId', async () => {
    const fetch = makeFetch(200, { status: 'ok', pet: samplePet });

    await makeClient(fetch).loadProfile('pet-pub-1');

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/pets/pet-pub-1');
  });

  it('returns pet_not_found on 404 response', async () => {
    const fetch = makeFetch(404, { status: 'pet_not_found' });

    const result = await makeClient(fetch).loadProfile('unknown-pet');

    expect(result).toMatchObject({ ok: false, status: 'pet_not_found' });
  });

  it('returns worker_request_failed on non-404 non-ok response', async () => {
    const fetch = makeFetch(503, { status: 'service_unavailable', reasons: ['downstream_error'] });

    const result = await makeClient(fetch).loadProfile('pet-pub-1');

    expect(result).toMatchObject({ ok: false, status: 'worker_request_failed' });
  });

  it('returns worker_request_failed with network_error reason when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).loadProfile('pet-pub-1');

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 200 with malformed body', async () => {
    const fetch = makeFetch(200, { status: 'ok', missingPet: true });

    const result = await makeClient(fetch).loadProfile('pet-pub-1');

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'worker_request_failed',
      reasons: ['error', 'service-role-secret', 'signedUrl=https://r2.test/token'],
    });

    const result = await makeClient(fetch).loadProfile('pet-pub-1');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('signedUrl');
  });
});
