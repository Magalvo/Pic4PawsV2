import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../apps/workers/src/index';

const supabaseMock = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseMock.createClient,
}));

const { default: worker } = await import('../../apps/workers/src/index');

const ANTI_PHISHING_KEY = 'ifthenpay-anti-phishing-key';
const SHELTER_ID = 'shelter-ifthenpay-001';
const REQUEST_ID = 'i2szvoUfPYBMWdSxqO3n';

const validIfthenpayEnv: WorkerEnv = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  PAYMENT_PRIMARY_PROVIDER: 'ifthenpay',
  PAYMENT_WEBHOOKS_ENABLED: 'true',
  IFTHENPAY_API_KEY: 'ifthenpay-api-key',
  IFTHENPAY_WEBHOOK_SECRET: ANTI_PHISHING_KEY,
};

// New path: /webhooks/payments/ifthenpay
const callbackUrl =
  'https://worker.test/webhooks/payments/ifthenpay' +
  `?key=${ANTI_PHISHING_KEY}` +
  `&orderId=1887` +
  `&amount=33.61` +
  `&requestId=${REQUEST_ID}` +
  '&payment_datetime=03-01-2024%2015%3A15%3A16';

const makeFromMock = () =>
  vi.fn().mockImplementation((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data:
        table === 'donation_transactions'
          ? { shelter_id: SHELTER_ID }
          : { ifthenpay_anti_phishing_key: ANTI_PHISHING_KEY },
      error: null,
    }),
  }));

describe('default Worker Ifthenpay webhook composition', () => {
  beforeEach(() => {
    supabaseMock.rpc.mockReset();
    supabaseMock.createClient.mockReset();
    supabaseMock.rpc.mockResolvedValue({
      data: {
        already_processed: false,
        donation_found: true,
        previous_status: 'pending_payment',
        new_status: 'paid',
        processed_at: '2026-06-20T12:00:00.000Z',
        financial_timestamp: '2026-06-20T12:00:00.000Z',
        raw_provider_event_ids: [`${REQUEST_ID}:paid`],
      },
      error: null,
    });
    supabaseMock.createClient.mockReturnValue({
      auth: { getUser: vi.fn() },
      from: makeFromMock(),
      rpc: supabaseMock.rpc,
    });
  });

  it('injects the Ifthenpay verifier and persists a verified paid callback', async () => {
    const response = await worker.fetch(new Request(callbackUrl, { method: 'GET' }), validIfthenpayEnv);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'webhook_accepted',
      donationFound: true,
    });
    expect(supabaseMock.rpc).toHaveBeenCalledWith('process_payment_webhook_event', {
      p_provider_event_id: `${REQUEST_ID}:paid`,
      p_provider: 'ifthenpay',
      p_provider_payment_id: REQUEST_ID,
      p_new_status: 'paid',
      p_payload: {
        orderId: '1887',
        amount: '33.61',
        requestId: REQUEST_ID,
        payment_datetime: '03-01-2024 15:15:16',
      },
      p_received_at: expect.any(String),
    });
    expect(JSON.stringify(supabaseMock.rpc.mock.calls[0]?.[1]?.p_payload)).not.toContain(
      ANTI_PHISHING_KEY,
    );
  });

  it('accepts a valid callback when the primary provider is Eupago', async () => {
    const response = await worker.fetch(new Request(callbackUrl, { method: 'GET' }), {
      ...validIfthenpayEnv,
      PAYMENT_PRIMARY_PROVIDER: 'eupago',
      EUPAGO_API_KEY: 'eupago-api-key',
      EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'webhook_accepted',
      donationFound: true,
    });
  });

  it('old GET /webhooks/payments → 410 gone', async () => {
    const legacyUrl =
      'https://worker.test/webhooks/payments' +
      `?key=${ANTI_PHISHING_KEY}&requestId=${REQUEST_ID}&orderId=1887&amount=33.61&payment_datetime=...`;

    const response = await worker.fetch(new Request(legacyUrl, { method: 'GET' }), validIfthenpayEnv);
    expect(response.status).toBe(410);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('gone');
  });
});
