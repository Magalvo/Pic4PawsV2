import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../apps/workers/src/index';
import { encryptCredential } from '../../apps/workers/src/crypto';

// ─── Supabase mock (module-level, hoisted) ────────────────────────────────────

const supabaseMock = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseMock.createClient,
}));

const { default: worker } = await import('../../apps/workers/src/index');

// ─── Constants ────────────────────────────────────────────────────────────────

const ENCRYPTION_SECRET = 'aaaabbbbccccddddeeeeffffgggghhhh'; // 32 bytes
const EUPAGO_WEBHOOK_SECRET = 'eupago-webhook-secret-for-test';
const SHELTER_ID = 'shelter-abc-123';
const TRANSACTION_ID = 'txn-eupago-001';

const validEupagoEnv: WorkerEnv = {
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
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  PAYMENT_WEBHOOKS_ENABLED: 'true',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'not-used-for-per-shelter',
  ENCRYPTION_SECRET,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const computeHmacHex = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const makeBody = (transactionId = TRANSACTION_ID) =>
  JSON.stringify({
    transactionId,
    value: '15.00',
    status: 'Success',
    date: '2026-06-28',
    method: 'MBW',
    alias: '+351910000001',
  });

// ─── Setup ────────────────────────────────────────────────────────────────────

let encryptedWebhookSecret: string;

beforeAll(async () => {
  encryptedWebhookSecret = await encryptCredential(EUPAGO_WEBHOOK_SECRET, ENCRYPTION_SECRET);
});

const makeFromMock = () =>
  vi.fn().mockImplementation((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data:
        table === 'donation_transactions'
          ? { shelter_id: SHELTER_ID }
          : { eupago_webhook_secret_encrypted: encryptedWebhookSecret },
      error: null,
    }),
  }));

beforeEach(() => {
  supabaseMock.rpc.mockReset();
  supabaseMock.createClient.mockReset();
  supabaseMock.rpc.mockResolvedValue({
    data: {
      already_processed: false,
      donation_found: true,
      previous_status: 'pending_payment',
      new_status: 'paid',
      processed_at: '2026-06-28T12:00:00.000Z',
      financial_timestamp: '2026-06-28T12:00:00.000Z',
      raw_provider_event_ids: [`${TRANSACTION_ID}:paid`],
    },
    error: null,
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Worker Eupago webhook composition', () => {
  it('valid callback with correct HMAC → 200 webhook_accepted', async () => {
    const body = makeBody();
    const sig = await computeHmacHex(body, EUPAGO_WEBHOOK_SECRET);
    supabaseMock.createClient.mockReturnValue({
      auth: { getUser: vi.fn() },
      from: makeFromMock(),
      rpc: supabaseMock.rpc,
    });

    const res = await worker.fetch(
      new Request('https://worker.test/webhooks/payments/eupago', {
        method: 'POST',
        headers: { 'x-eupago-signature': sig, 'Content-Type': 'application/json' },
        body,
      }),
      validEupagoEnv,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ status: 'webhook_accepted' });
  });

  it('accepts a valid callback when the primary provider is Ifthenpay', async () => {
    const body = makeBody();
    const sig = await computeHmacHex(body, EUPAGO_WEBHOOK_SECRET);
    supabaseMock.createClient.mockReturnValue({
      auth: { getUser: vi.fn() },
      from: makeFromMock(),
      rpc: supabaseMock.rpc,
    });

    const res = await worker.fetch(
      new Request('https://worker.test/webhooks/payments/eupago', {
        method: 'POST',
        headers: { 'x-eupago-signature': sig, 'Content-Type': 'application/json' },
        body,
      }),
      {
        ...validEupagoEnv,
        PAYMENT_PRIMARY_PROVIDER: 'ifthenpay',
        IFTHENPAY_API_KEY: 'ifthenpay-api-key',
        IFTHENPAY_WEBHOOK_SECRET: 'ifthenpay-webhook-secret',
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ status: 'webhook_accepted' });
  });

  it('invalid signature → 401', async () => {
    const body = makeBody();
    supabaseMock.createClient.mockReturnValue({
      auth: { getUser: vi.fn() },
      from: makeFromMock(),
      rpc: supabaseMock.rpc,
    });

    const res = await worker.fetch(
      new Request('https://worker.test/webhooks/payments/eupago', {
        method: 'POST',
        headers: { 'x-eupago-signature': 'baadsignature00', 'Content-Type': 'application/json' },
        body,
      }),
      validEupagoEnv,
    );

    expect(res.status).toBe(401);
  });

  it('Eupago route rejects GET → 405', async () => {
    supabaseMock.createClient.mockReturnValue({
      auth: { getUser: vi.fn() },
      from: vi.fn(),
      rpc: supabaseMock.rpc,
    });

    const res = await worker.fetch(
      new Request('https://worker.test/webhooks/payments/eupago', { method: 'GET' }),
      validEupagoEnv,
    );

    expect(res.status).toBe(405);
  });

  it('legacy POST /webhooks/payments → 410 gone', async () => {
    supabaseMock.createClient.mockReturnValue({
      auth: { getUser: vi.fn() },
      from: vi.fn(),
      rpc: supabaseMock.rpc,
    });

    const res = await worker.fetch(
      new Request('https://worker.test/webhooks/payments', { method: 'POST' }),
      validEupagoEnv,
    );

    expect(res.status).toBe(410);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('gone');
  });

  it('legacy GET /webhooks/payments → 410 gone', async () => {
    supabaseMock.createClient.mockReturnValue({
      auth: { getUser: vi.fn() },
      from: vi.fn(),
      rpc: supabaseMock.rpc,
    });

    const res = await worker.fetch(
      new Request('https://worker.test/webhooks/payments', { method: 'GET' }),
      validEupagoEnv,
    );

    expect(res.status).toBe(410);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('gone');
  });
});
