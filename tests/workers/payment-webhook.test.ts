import { describe, expect, it, vi } from 'vitest';
import {
  handleWorkerPaymentWebhookRequest,
  PROVIDER_SIGNATURE_HEADERS,
  type ParsedWebhookEvent,
  type PaymentWebhookRepository,
  type PaymentWebhookVerifier,
} from '../../apps/workers/src/payment-webhook';

const makeRequest = (headers: Record<string, string> = {}): Request =>
  new Request('https://worker.example.com/webhooks/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
  });

const sampleParsedEvent: ParsedWebhookEvent = {
  providerEventId: 'evt_001',
  providerPaymentId: 'pay_001',
  newStatus: 'paid',
  payload: { type: 'payment.completed', id: 'evt_001' },
};

const makeVerifier = (result: ParsedWebhookEvent | null): PaymentWebhookVerifier =>
  vi.fn().mockReturnValue(result);

const makeRepository = (overrides: Partial<PaymentWebhookRepository> = {}): PaymentWebhookRepository => ({
  isEventAlreadyProcessed: vi.fn().mockResolvedValue(false),
  recordWebhookEvent: vi.fn().mockResolvedValue(undefined),
  updateDonationStatus: vi.fn().mockResolvedValue({ found: true }),
  ...overrides,
});

describe('handleWorkerPaymentWebhookRequest', () => {
  it('returns 501 payment_webhook_verifier_not_configured when no verifier provided', async () => {
    const response = await handleWorkerPaymentWebhookRequest({
      request: makeRequest(),
      rawBody: '{}',
      provider: 'stripe',
      webhookSecret: 'whsec_test',
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(response.status).toBe(501);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('payment_webhook_verifier_not_configured');
  });

  it('returns 401 webhook_signature_invalid when verifier returns null', async () => {
    const response = await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'stripe-signature': 't=123,v1=abc' }),
      rawBody: '{"type":"payment.completed"}',
      provider: 'stripe',
      webhookSecret: 'whsec_test',
      paymentWebhookVerifier: makeVerifier(null),
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(response.status).toBe(401);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('webhook_signature_invalid');
  });

  it('returns 501 payment_webhook_repository_not_configured when verifier ok but no repo', async () => {
    const response = await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'stripe-signature': 't=123,v1=abc' }),
      rawBody: '{"type":"payment.completed"}',
      provider: 'stripe',
      webhookSecret: 'whsec_test',
      paymentWebhookVerifier: makeVerifier(sampleParsedEvent),
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(response.status).toBe(501);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('payment_webhook_repository_not_configured');
  });

  it('returns 200 webhook_already_processed when event already processed (idempotent)', async () => {
    const repo = makeRepository({
      isEventAlreadyProcessed: vi.fn().mockResolvedValue(true),
    });

    const response = await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'stripe-signature': 't=123,v1=abc' }),
      rawBody: '{"type":"payment.completed"}',
      provider: 'stripe',
      webhookSecret: 'whsec_test',
      paymentWebhookVerifier: makeVerifier(sampleParsedEvent),
      paymentWebhookRepository: repo,
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('webhook_already_processed');
    expect(repo.recordWebhookEvent).not.toHaveBeenCalled();
    expect(repo.updateDonationStatus).not.toHaveBeenCalled();
  });

  it('returns 200 webhook_accepted with donationFound true on happy path', async () => {
    const repo = makeRepository();

    const response = await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'stripe-signature': 't=123,v1=abc' }),
      rawBody: '{"type":"payment.completed"}',
      provider: 'stripe',
      webhookSecret: 'whsec_test',
      paymentWebhookVerifier: makeVerifier(sampleParsedEvent),
      paymentWebhookRepository: repo,
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; donationFound: boolean };
    expect(body.status).toBe('webhook_accepted');
    expect(body.donationFound).toBe(true);
  });

  it('returns 200 webhook_accepted with donationFound false when donation not found', async () => {
    const repo = makeRepository({
      updateDonationStatus: vi.fn().mockResolvedValue({ found: false }),
    });

    const response = await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'stripe-signature': 't=123,v1=abc' }),
      rawBody: '{"type":"payment.completed"}',
      provider: 'stripe',
      webhookSecret: 'whsec_test',
      paymentWebhookVerifier: makeVerifier(sampleParsedEvent),
      paymentWebhookRepository: repo,
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; donationFound: boolean };
    expect(body.status).toBe('webhook_accepted');
    expect(body.donationFound).toBe(false);
  });

  it('passes correct rawBody, signatureHeader and secret to verifier', async () => {
    const verifier = makeVerifier(sampleParsedEvent);
    const repo = makeRepository();
    const rawBody = '{"type":"payment.completed","id":"evt_001"}';

    await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'stripe-signature': 't=123,v1=sigvalue' }),
      rawBody,
      provider: 'stripe',
      webhookSecret: 'whsec_real_secret',
      paymentWebhookVerifier: verifier,
      paymentWebhookRepository: repo,
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(verifier).toHaveBeenCalledWith({
      rawBody,
      signatureHeader: 't=123,v1=sigvalue',
      secret: 'whsec_real_secret',
    });
  });

  it('reads eupago signature from x-eupago-signature header', async () => {
    const verifier = makeVerifier(sampleParsedEvent);
    const repo = makeRepository();

    await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'x-eupago-signature': 'eupago-sig-value' }),
      rawBody: '{}',
      provider: 'eupago',
      webhookSecret: 'eupago-secret',
      paymentWebhookVerifier: verifier,
      paymentWebhookRepository: repo,
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(verifier).toHaveBeenCalledWith(
      expect.objectContaining({ signatureHeader: 'eupago-sig-value' }),
    );
  });

  it('calls recordWebhookEvent and updateDonationStatus with correct params', async () => {
    const repo = makeRepository();

    await handleWorkerPaymentWebhookRequest({
      request: makeRequest({ 'stripe-signature': 't=123,v1=abc' }),
      rawBody: '{"type":"payment.completed","id":"evt_001"}',
      provider: 'stripe',
      webhookSecret: 'whsec_test',
      paymentWebhookVerifier: makeVerifier(sampleParsedEvent),
      paymentWebhookRepository: repo,
      now: '2026-06-08T12:00:00.000Z',
    });

    expect(repo.recordWebhookEvent).toHaveBeenCalledWith({
      providerEventId: 'evt_001',
      provider: 'stripe',
      payload: { type: 'payment.completed', id: 'evt_001' },
      receivedAt: '2026-06-08T12:00:00.000Z',
    });

    expect(repo.updateDonationStatus).toHaveBeenCalledWith({
      providerPaymentId: 'pay_001',
      provider: 'stripe',
      newStatus: 'paid',
      providerEventId: 'evt_001',
    });
  });

  it('PROVIDER_SIGNATURE_HEADERS exports correct header names for all providers', () => {
    expect(PROVIDER_SIGNATURE_HEADERS.eupago).toBe('x-eupago-signature');
    expect(PROVIDER_SIGNATURE_HEADERS.ifthenpay).toBe('x-ifthenpay-signature');
    expect(PROVIDER_SIGNATURE_HEADERS.stripe).toBe('stripe-signature');
  });
});
