import { describe, expect, it, vi } from 'vitest';
import { createShelterProfileClient } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const sampleShelter = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter' as const,
  verificationStatus: 'verified' as const,
  publicEmail: 'contacto@abrigodosamigos.pt',
  publicPhone: '+351912345678',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  description: 'Um abrigo com coração.',
  logoMediaId: 'logo-media-1',
  coverMediaId: 'cover-media-1',
};

const makeClient = (fetch: ReturnType<typeof vi.fn>) =>
  createShelterProfileClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    shelterPath: '/shelters',
    fetch: fetch as never,
  });

describe('ShelterProfileClient contract', () => {
  it('returns success with shelter on 200 response', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelter: sampleShelter });

    const result = await makeClient(fetch).loadProfile('shelter-a');

    expect(result).toEqual({ ok: true, status: 'ok', shelter: sampleShelter });
  });

  it('includes the verificationStatus field in the returned shelter', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelter: sampleShelter });

    const result = await makeClient(fetch).loadProfile('shelter-a');

    expect(result.ok && result.shelter.verificationStatus).toBe('verified');
  });

  it('constructs the URL as shelterPath/shelterId', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelter: sampleShelter });

    await makeClient(fetch).loadProfile('shelter-a');

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/shelters/shelter-a');
  });

  it('returns shelter_not_found on 404 response', async () => {
    const fetch = makeFetch(404, { status: 'shelter_not_found' });

    const result = await makeClient(fetch).loadProfile('unknown-shelter');

    expect(result).toMatchObject({ ok: false, status: 'shelter_not_found' });
  });

  it('returns worker_request_failed on non-404 non-ok response', async () => {
    const fetch = makeFetch(503, {
      status: 'service_unavailable',
      reasons: ['downstream_error'],
    });

    const result = await makeClient(fetch).loadProfile('shelter-a');

    expect(result).toMatchObject({ ok: false, status: 'worker_request_failed' });
  });

  it('returns worker_request_failed with network_error reason when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).loadProfile('shelter-a');

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 200 with malformed body', async () => {
    const fetch = makeFetch(200, { status: 'ok', missingShelter: true });

    const result = await makeClient(fetch).loadProfile('shelter-a');

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'worker_request_failed',
      reasons: ['error', 'service-role-secret', 'signedUrl=https://r2.test/token'],
    });

    const result = await makeClient(fetch).loadProfile('shelter-a');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('signedUrl');
  });
});
