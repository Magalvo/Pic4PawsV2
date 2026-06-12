import { describe, expect, it, vi } from 'vitest';
import { createPetFeedClient } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const samplePet = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  name: 'Bobi',
  species: 'dog' as const,
  locationLabel: 'Porto',
  shortDescription: 'Amigável.',
  heroMediaId: 'media-1',
  mediaIds: ['media-1'],
  publishedAt: '2026-06-01T10:00:00.000Z',
};

const makeClient = (fetch: ReturnType<typeof vi.fn>) =>
  createPetFeedClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    petFeedPath: '/pets',
    fetch: fetch as never,
  });

describe('PetFeedClient contract', () => {
  it('returns success with pets and total on 200 response', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [samplePet, samplePet], total: 2 });

    const result = await makeClient(fetch).loadFeed({});

    expect(result).toEqual({ ok: true, status: 'ok', pets: [samplePet, samplePet], total: 2 });
  });

  it('returns success with empty pets on 200 with empty array', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [], total: 0 });

    const result = await makeClient(fetch).loadFeed({});

    expect(result).toEqual({ ok: true, status: 'ok', pets: [], total: 0 });
  });

  it('adds species query param when species is provided', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [], total: 0 });

    await makeClient(fetch).loadFeed({ species: 'dog' });

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(new URL(calledUrl).searchParams.get('species')).toBe('dog');
  });

  it('adds location query param when location is provided', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [], total: 0 });

    await makeClient(fetch).loadFeed({ location: 'Lisboa' });

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(new URL(calledUrl).searchParams.get('location')).toBe('Lisboa');
  });

  it('omits location param when location is null', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [], total: 0 });

    await makeClient(fetch).loadFeed({ location: null });

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(new URL(calledUrl).searchParams.has('location')).toBe(false);
  });

  it('adds both species and location params when both are provided', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [], total: 0 });

    await makeClient(fetch).loadFeed({ species: 'cat', location: 'Porto' });

    const calledUrl = fetch.mock.calls[0][0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get('species')).toBe('cat');
    expect(url.searchParams.get('location')).toBe('Porto');
  });

  it('adds limit and offset query params when provided', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [], total: 0 });

    await makeClient(fetch).loadFeed({ limit: 5, offset: 10 });

    const calledUrl = fetch.mock.calls[0][0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get('limit')).toBe('5');
    expect(url.searchParams.get('offset')).toBe('10');
  });

  it('omits query params when query has no values set', async () => {
    const fetch = makeFetch(200, { status: 'ok', pets: [], total: 0 });

    await makeClient(fetch).loadFeed({});

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(new URL(calledUrl).search).toBe('');
  });

  it('returns worker_request_failed on non-ok HTTP response', async () => {
    const fetch = makeFetch(503, { status: 'service_unavailable', reasons: ['downstream_error'] });

    const result = await makeClient(fetch).loadFeed({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
    }
  });

  it('returns worker_request_failed with network_error reason when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).loadFeed({});

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 200 with malformed body', async () => {
    const fetch = makeFetch(200, { status: 'ok', missingPets: true });

    const result = await makeClient(fetch).loadFeed({});

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'worker_request_failed',
      reasons: ['error', 'service-role-secret', 'bearer token-value'],
    });

    const result = await makeClient(fetch).loadFeed({});
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
