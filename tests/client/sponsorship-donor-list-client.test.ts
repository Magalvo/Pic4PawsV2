import { describe, expect, it, vi } from 'vitest';
import { createSponsorshipDonorListClient } from '../../packages/client/src/index';
import type {
  SponsorshipDonorListClient,
  MediaUploadClientFetch,
} from '../../packages/client/src/index';

const workerBaseUrl = 'https://workers.pic4paws.pt';
const sponsorshipsPath = '/sponsorships' as const;

const makeFetch = (
  status: number,
  body: Record<string, unknown>,
): MediaUploadClientFetch =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

const throwingFetch: MediaUploadClientFetch = vi.fn().mockRejectedValue(
  new Error('Network error'),
);

const makeClient = (
  fetch: MediaUploadClientFetch,
  token: string | null = 'valid-token',
): SponsorshipDonorListClient =>
  createSponsorshipDonorListClient({
    workerBaseUrl,
    sponsorshipsPath,
    getAccessToken: async () => token,
    fetch,
  });

const sampleSponsorships = [
  {
    sponsorshipId: 'spons-001',
    amountCents: 1500,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    recurringInterval: 'monthly',
    status: 'active',
    petId: 'pet-a',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
];

describe('createSponsorshipDonorListClient', () => {
  it('returns unauthenticated when getAccessToken returns null', async () => {
    const client = makeClient(makeFetch(200, {}), null);
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns unauthenticated when getAccessToken returns whitespace', async () => {
    const client = makeClient(makeFetch(200, {}), '   ');
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = makeClient(throwingFetch);
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns unauthenticated on 401', async () => {
    const client = makeClient(makeFetch(401, { status: 'unauthenticated' }));
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns sponsorship_donor_list_repository_not_configured on 501', async () => {
    const client = makeClient(
      makeFetch(501, { status: 'sponsorship_donor_list_repository_not_configured' }),
    );
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('sponsorship_donor_list_repository_not_configured');
    }
  });

  it('returns success with sponsorships array and total on 200', async () => {
    const client = makeClient(
      makeFetch(200, { status: 'ok', sponsorships: sampleSponsorships, total: 1 }),
    );
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.sponsorships).toHaveLength(1);
      expect(result.sponsorships[0]?.sponsorshipId).toBe('spons-001');
      expect(result.total).toBe(1);
    }
  });

  it('returns worker_response_invalid when 200 body is missing sponsorships', async () => {
    const client = makeClient(makeFetch(200, { status: 'ok', total: 1 }));
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_response_invalid');
    }
  });

  it('returns worker_response_invalid when 200 body is missing total', async () => {
    const client = makeClient(
      makeFetch(200, { status: 'ok', sponsorships: sampleSponsorships }),
    );
    const result = await client.loadDonorSponsorships();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_response_invalid');
    }
  });

  it('strips credential markers from failure reasons', async () => {
    const client = makeClient(
      makeFetch(500, {
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    );
    const result = await client.loadDonorSponsorships();
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('sends GET to sponsorshipsPath with Bearer token', async () => {
    const fetchSpy = makeFetch(200, {
      status: 'ok',
      sponsorships: sampleSponsorships,
      total: 1,
    });
    const client = makeClient(fetchSpy, 'my-token');
    await client.loadDonorSponsorships();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toContain('/sponsorships');
    expect(url).not.toContain('/sponsorships/');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });

  it('appends limit and offset as query params', async () => {
    const fetchSpy = makeFetch(200, {
      status: 'ok',
      sponsorships: [],
      total: 0,
    });
    const client = makeClient(fetchSpy, 'my-token');
    await client.loadDonorSponsorships({ limit: 10, offset: 20 });

    const [url] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=20');
  });
});
