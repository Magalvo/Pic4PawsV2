import { describe, expect, it, vi } from 'vitest';
import { createDonationClient } from '../../packages/client/src/index';

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
  createDonationClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    donationsPath: '/donations',
    getAccessToken,
    fetch: fetch as never,
  });

const validInput = {
  shelterId: 'shelter-a',
  amountCents: 1000,
  kind: 'one_time_donation' as const,
  paymentMethod: 'mb_way' as const,
  petId: null,
  publicMessage: null,
  anonymous: false,
  donorDisplayName: 'João Silva',
  donorEmail: 'joao@example.pt',
  dataProcessingAccepted: true as const,
};

const successBody = {
  status: 'donation_created',
  donationId: 'donation-001',
  amountCents: 1000,
  currency: 'EUR',
  kind: 'one_time_donation',
  shelterId: 'shelter-a',
  createdAt: '2026-06-08T10:00:00.000Z',
  tier: 'manual',
  iban: 'PT50000201231234567890154',
  mbWayPhone: null,
};

describe('DonationClient contract', () => {
  it('returns ok with donation_created on valid 201 response', async () => {
    const fetch = makeFetch(201, successBody);

    const result = await makeClient(fetch).submitDonation(validInput);

    expect(result.ok).toBe(true);
    expect(result.status).toBe('donation_created');
  });

  it('response includes donationId and manual-tier fields', async () => {
    const fetch = makeFetch(201, successBody);

    const result = await makeClient(fetch).submitDonation(validInput);

    if (!result.ok || result.tier !== 'manual') throw new Error('expected manual success');

    expect(result.donationId).toBe('donation-001');
    expect(result.amountCents).toBe(1000);
    expect(result.currency).toBe('EUR');
    expect(result.kind).toBe('one_time_donation');
    expect(result.shelterId).toBe('shelter-a');
    expect(result.createdAt).toBeTruthy();
    expect(result.iban).toBe('PT50000201231234567890154');
  });

  it('automated tier multibanco → ok true with reference.method multibanco', async () => {
    const fetch = makeFetch(201, {
      status: 'donation_created',
      donationId: 'donation-auto-001',
      tier: 'automated',
      provider: 'eupago',
      reference: {
        method: 'multibanco',
        entity: '10611',
        reference: '123456789',
        expiresAt: '2026-07-01T00:00:00.000Z',
      },
    });

    const result = await makeClient(fetch).submitDonation(validInput);

    if (!result.ok || result.tier !== 'automated') throw new Error('expected automated success');

    expect(result.donationId).toBe('donation-auto-001');
    expect(result.provider).toBe('eupago');
    expect(result.reference.method).toBe('multibanco');
    if (result.reference.method === 'multibanco') {
      expect(result.reference.entity).toBe('10611');
      expect(result.reference.reference).toBe('123456789');
      expect(result.reference.expiresAt).toBe('2026-07-01T00:00:00.000Z');
    }
  });

  it('automated tier mb_way → ok true with reference.method mb_way', async () => {
    const fetch = makeFetch(201, {
      status: 'donation_created',
      donationId: 'donation-auto-002',
      tier: 'automated',
      provider: 'eupago',
      reference: {
        method: 'mb_way',
        phone: '+351910000001',
        expiresAt: null,
      },
    });

    const result = await makeClient(fetch).submitDonation(validInput);

    if (!result.ok || result.tier !== 'automated') throw new Error('expected automated success');
    expect(result.reference.method).toBe('mb_way');
    if (result.reference.method === 'mb_way') {
      expect(result.reference.phone).toBe('+351910000001');
    }
  });

  it('automated tier missing reference → worker_response_invalid', async () => {
    const fetch = makeFetch(201, {
      status: 'donation_created',
      donationId: 'donation-auto-003',
      tier: 'automated',
      provider: 'eupago',
      // no reference field
    });

    const result = await makeClient(fetch).submitDonation(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_response_invalid');
  });

  it('502 payment_reference_failed → client failure with that status', async () => {
    const fetch = makeFetch(502, { status: 'payment_reference_failed' });

    const result = await makeClient(fetch).submitDonation(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('payment_reference_failed');
  });

  it('503 provider_credentials_unavailable → client failure with that status', async () => {
    const fetch = makeFetch(503, { status: 'provider_credentials_unavailable' });

    const result = await makeClient(fetch).submitDonation(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('provider_credentials_unavailable');
  });

  it('constructs URL as {workerBaseUrl}/donations', async () => {
    const fetch = makeFetch(201, successBody);

    await makeClient(fetch).submitDonation(validInput);

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/donations');
  });

  it('sends POST with Authorization Bearer header', async () => {
    const fetch = makeFetch(201, successBody);

    await makeClient(fetch).submitDonation(validInput);

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)['Authorization']).toBe(
      `Bearer ${validToken}`,
    );
    expect(calledInit.method).toBe('POST');
  });

  it('sends shelterId and amountCents in the request body', async () => {
    const fetch = makeFetch(201, successBody);

    await makeClient(fetch).submitDonation(validInput);

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(calledInit.body as string) as Record<string, unknown>;
    expect(body['shelterId']).toBe('shelter-a');
    expect(body['amountCents']).toBe(1000);
    expect(body['dataProcessingAccepted']).toBe(true);
  });

  it('returns unauthenticated when getAccessToken resolves to null', async () => {
    const fetch = makeFetch(201, successBody);

    const result = await makeClient(fetch, () => Promise.resolve(null)).submitDonation(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns invalid_donation on 400 response', async () => {
    const fetch = makeFetch(400, {
      status: 'invalid_donation',
      reasons: ['amount_cents_must_be_at_least_100'],
    });

    const result = await makeClient(fetch).submitDonation(validInput);

    expect(result).toMatchObject({ ok: false, status: 'invalid_donation' });
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).submitDonation(validInput);

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on 201 with malformed body', async () => {
    const fetch = makeFetch(201, { status: 'donation_created', missingFields: true });

    const result = await makeClient(fetch).submitDonation(validInput);

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'server_error',
      reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
    });

    const result = await makeClient(fetch).submitDonation(validInput);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });
});
