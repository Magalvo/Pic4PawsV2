import { describe, expect, it, vi } from 'vitest';
import { createShelterSearchClient } from '../../packages/client/src/index';

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
  kind: 'shelter',
  verificationStatus: 'verified',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  logoMediaId: 'logo-1',
};

const makeClient = (fetch: ReturnType<typeof vi.fn>) =>
  createShelterSearchClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    shelterPath: '/shelters',
    fetch,
  });

describe('ShelterSearchClient contract', () => {
  it('returns success with shelters and total on 200 response', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelters: [sampleShelter], total: 1 });

    const result = await makeClient(fetch).searchShelters({});

    expect(result).toEqual({ ok: true, status: 'ok', shelters: [sampleShelter], total: 1 });
  });

  it('returns success with empty shelters on 200 with empty array', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelters: [], total: 0 });

    const result = await makeClient(fetch).searchShelters({});

    expect(result).toEqual({ ok: true, status: 'ok', shelters: [], total: 0 });
  });

  it('sends GET request to the shelter path', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelters: [], total: 0 });

    await makeClient(fetch).searchShelters({});

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(new URL(calledUrl).pathname).toBe('/shelters');
    expect(fetch.mock.calls[0][1]?.method ?? 'GET').toBe('GET');
  });

  it('adds kind query param when kind is provided', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelters: [], total: 0 });

    await makeClient(fetch).searchShelters({ kind: 'sanctuary' });

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(new URL(calledUrl).searchParams.get('kind')).toBe('sanctuary');
  });

  it('adds limit and offset query params when provided', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelters: [], total: 0 });

    await makeClient(fetch).searchShelters({ limit: 5, offset: 10 });

    const calledUrl = fetch.mock.calls[0][0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get('limit')).toBe('5');
    expect(url.searchParams.get('offset')).toBe('10');
  });

  it('omits query params when query has no values set', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelters: [], total: 0 });

    await makeClient(fetch).searchShelters({});

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(new URL(calledUrl).search).toBe('');
  });

  it('returns worker_request_failed on non-ok HTTP response', async () => {
    const fetch = makeFetch(503, { status: 'service_unavailable', reasons: ['downstream'] });

    const result = await makeClient(fetch).searchShelters({});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_request_failed');
  });

  it('returns worker_request_failed with network_error reason when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).searchShelters({});

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 200 with malformed body', async () => {
    const fetch = makeFetch(200, { status: 'ok', missingShelters: true });

    const result = await makeClient(fetch).searchShelters({});

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'error',
      reasons: ['service-role-secret', 'bearer abc123'],
    });

    const result = await makeClient(fetch).searchShelters({});
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });
});
