import { describe, expect, it, vi } from 'vitest';
import { createSponsorshipClient } from '../../packages/client/src/index';

const makeFetch = (
  response: { ok?: boolean; status?: number; body?: unknown },
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

function sampleSuccess() {
  return {
    status: 'sponsorship_created',
    sponsorshipId: 'sponsorship-abc',
    amountCents: 1000,
    currency: 'EUR',
    recurringInterval: 'monthly',
    shelterId: 'shelter-001',
    createdAt: '2026-06-08T12:00:00.000Z',
  };
}

const baseInput = {
  workerBaseUrl: 'https://worker.example.com',
  sponsorshipsPath: '/sponsorships' as `/${string}`,
  getAccessToken: async () => 'test-token',
  fetch: makeFetch({ ok: true, body: sampleSuccess() }),
};

const validInput = {
  shelterId: 'shelter-001',
  amountCents: 1000,
  paymentMethod: 'mb_way' as const,
  recurringInterval: 'monthly' as const,
  petId: null,
  dataProcessingAccepted: true as const,
};

describe('createSponsorshipClient', () => {
  it('returns unauthenticated when access token is null', async () => {
    const client = createSponsorshipClient({
      ...baseInput,
      getAccessToken: async () => null,
    });

    const result = await client.submitSponsorship(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated when access token is blank', async () => {
    const client = createSponsorshipClient({
      ...baseInput,
      getAccessToken: async () => '   ',
    });

    const result = await client.submitSponsorship(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('calls the correct URL with Bearer header and JSON body', async () => {
    const fetchFn = makeFetch({ ok: true, body: sampleSuccess() });
    const client = createSponsorshipClient({ ...baseInput, fetch: fetchFn });

    await client.submitSponsorship(validInput);

    expect(fetchFn).toHaveBeenCalledWith(
      'https://worker.example.com/sponsorships',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = createSponsorshipClient({
      ...baseInput,
      fetch: makeFetchThrows(),
    });

    const result = await client.submitSponsorship(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns invalid_sponsorship when worker responds 400', async () => {
    const client = createSponsorshipClient({
      ...baseInput,
      fetch: makeFetch({
        ok: false,
        status: 400,
        body: { status: 'invalid_sponsorship', reasons: ['amount_cents_must_be_at_least_100'] },
      }),
    });

    const result = await client.submitSponsorship(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('invalid_sponsorship');
      expect(result.reasons).toContain('amount_cents_must_be_at_least_100');
    }
  });

  it('returns unauthenticated when worker responds 401', async () => {
    const client = createSponsorshipClient({
      ...baseInput,
      fetch: makeFetch({ ok: false, status: 401, body: { status: 'unauthenticated' } }),
    });

    const result = await client.submitSponsorship(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns worker_response_invalid when success body has wrong shape', async () => {
    const client = createSponsorshipClient({
      ...baseInput,
      fetch: makeFetch({ ok: true, body: { status: 'sponsorship_created', sponsorshipId: null } }),
    });

    const result = await client.submitSponsorship(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_response_invalid');
  });

  it('returns success with mapped sponsorship on happy path', async () => {
    const client = createSponsorshipClient({
      ...baseInput,
      fetch: makeFetch({ ok: true, body: sampleSuccess() }),
    });

    const result = await client.submitSponsorship(validInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('sponsorship_created');
      expect(result.sponsorshipId).toBe('sponsorship-abc');
      expect(result.amountCents).toBe(1000);
      expect(result.currency).toBe('EUR');
      expect(result.recurringInterval).toBe('monthly');
      expect(result.shelterId).toBe('shelter-001');
    }
  });

  it('sanitizes credential markers from failure reasons', async () => {
    const client = createSponsorshipClient({
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

    const result = await client.submitSponsorship(validInput);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-key');
    expect(serialized).not.toContain('bearer abc');
  });
});
