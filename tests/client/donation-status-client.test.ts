import { describe, expect, it, vi } from 'vitest';
import { createDonationStatusClient } from '../../packages/client/src/index';

const makeFetch = (
  response: Partial<Response> & { body?: unknown },
): typeof globalThis.fetch => {
  return vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.body ?? {},
    text: async () => JSON.stringify(response.body ?? {}),
  } as Response);
};

const makeFetchThrows = (): typeof globalThis.fetch =>
  vi.fn().mockRejectedValue(new Error('network failure'));

const baseInput = {
  workerBaseUrl: 'https://worker.example.com',
  donationsPath: '/donations' as `/${string}`,
  getAccessToken: async () => 'test-token',
  fetch: makeFetch({ ok: true, body: { status: 'ok', donation: sampleDonation() } }),
};

function sampleDonation() {
  return {
    donationId: 'donation-abc',
    kind: 'one_time_donation',
    donationStatus: 'paid',
    amountCents: 1000,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    shelterId: 'shelter-001',
    petId: null,
    createdAt: '2026-06-08T12:00:00.000Z',
  };
}

describe('createDonationStatusClient', () => {
  it('returns unauthenticated when access token is null', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      getAccessToken: async () => null,
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated when access token is empty string', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      getAccessToken: async () => '   ',
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('calls the correct URL with Bearer header', async () => {
    const fetchFn = makeFetch({ ok: true, body: { status: 'ok', donation: sampleDonation() } });
    const client = createDonationStatusClient({ ...baseInput, fetch: fetchFn });

    await client.loadDonationStatus('donation-abc');

    expect(fetchFn).toHaveBeenCalledWith(
      'https://worker.example.com/donations/donation-abc',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      fetch: makeFetchThrows(),
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns forbidden when worker responds 403', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      fetch: makeFetch({ ok: false, status: 403, body: { status: 'forbidden' } }),
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('forbidden');
  });

  it('returns donation_not_found when worker responds 404', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      fetch: makeFetch({ ok: false, status: 404, body: { status: 'donation_not_found' } }),
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('donation_not_found');
  });

  it('returns worker_response_invalid when success body has wrong shape', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      fetch: makeFetch({ ok: true, body: { status: 'ok', donation: null } }),
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_response_invalid');
  });

  it('returns success with mapped donation on happy path', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      fetch: makeFetch({ ok: true, body: { status: 'ok', donation: sampleDonation() } }),
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.donation.donationId).toBe('donation-abc');
      expect(result.donation.donationStatus).toBe('paid');
      expect(result.donation.amountCents).toBe(1000);
      expect(result.donation.currency).toBe('EUR');
    }
  });

  it('sanitizes credential markers from failure reasons', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      fetch: makeFetch({
        ok: false,
        status: 500,
        body: {
          status: 'worker_request_failed',
          reasons: ['safe_reason', 'service-role-key', 'bearer abc'],
        },
      }),
    });

    const result = await client.loadDonationStatus('donation-abc');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-key');
    expect(serialized).not.toContain('bearer abc');
  });

  it('returns unauthenticated when worker responds 401', async () => {
    const client = createDonationStatusClient({
      ...baseInput,
      fetch: makeFetch({ ok: false, status: 401, body: { status: 'unauthenticated' } }),
    });

    const result = await client.loadDonationStatus('donation-abc');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });
});
