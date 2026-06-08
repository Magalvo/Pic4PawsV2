import { describe, expect, it, vi } from 'vitest';
import { createDonationListClient } from '../../packages/client/src/index';
import type {
  DonationListApplication,
  DonationListClientSuccess,
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
  createDonationListClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    shelterPath: '/shelters',
    getAccessToken,
    fetch,
  });

const sampleDonation: DonationListApplication = {
  donationId: 'donation-001',
  kind: 'one_time_donation',
  status: 'paid',
  amountCents: 1000,
  currency: 'EUR',
  paymentMethod: 'mb_way',
  anonymous: false,
  donorDisplayName: 'João Silva',
  publicMessage: 'Força abrigo!',
  createdAt: '2026-06-08T10:00:00.000Z',
};

const successBody = {
  status: 'ok',
  donations: [sampleDonation],
  total: 1,
};

describe('DonationListClient contract', () => {
  it('returns ok with donations and total on valid 200 response', async () => {
    const fetch = makeFetch(200, successBody);

    const result = await makeClient(fetch).loadDonations('shelter-a');

    expect(result.ok).toBe(true);
    expect(result.status).toBe('ok');
  });

  it('response includes typed donations array and numeric total', async () => {
    const fetch = makeFetch(200, successBody);

    const result = (await makeClient(fetch).loadDonations('shelter-a')) as DonationListClientSuccess;

    expect(Array.isArray(result.donations)).toBe(true);
    expect(result.total).toBe(1);
    expect(result.donations[0]?.donationId).toBe('donation-001');
    expect(result.donations[0]?.amountCents).toBe(1000);
    expect(result.donations[0]?.donorDisplayName).toBe('João Silva');
  });

  it('constructs URL as {workerBaseUrl}/shelters/{shelterId}/donations', async () => {
    const fetch = makeFetch(200, successBody);

    await makeClient(fetch).loadDonations('shelter-a');

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/shelters/shelter-a/donations');
  });

  it('appends limit and offset as query params when provided', async () => {
    const fetch = makeFetch(200, successBody);

    await makeClient(fetch).loadDonations('shelter-a', { limit: 10, offset: 20 });

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('offset=20');
  });

  it('sends GET with Authorization Bearer header', async () => {
    const fetch = makeFetch(200, successBody);

    await makeClient(fetch).loadDonations('shelter-a');

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)['Authorization']).toBe(
      `Bearer ${validToken}`,
    );
    expect(calledInit.method).toBe('GET');
  });

  it('returns unauthenticated when getAccessToken resolves to null', async () => {
    const fetch = makeFetch(200, successBody);

    const result = await makeClient(fetch, () => Promise.resolve(null)).loadDonations('shelter-a');

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403 response', async () => {
    const fetch = makeFetch(403, { status: 'forbidden' });

    const result = await makeClient(fetch).loadDonations('shelter-a');

    expect(result).toMatchObject({ ok: false, status: 'forbidden' });
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).loadDonations('shelter-a');

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 200 with malformed body', async () => {
    const fetch = makeFetch(200, { status: 'ok', missingDonations: true });

    const result = await makeClient(fetch).loadDonations('shelter-a');

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'server_error',
      reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
    });

    const result = await makeClient(fetch).loadDonations('shelter-a');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });
});
