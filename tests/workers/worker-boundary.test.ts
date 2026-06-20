import { describe, expect, it } from 'vitest';
import { handleWorkerRequest, type WorkerEnv } from '../../apps/workers/src/index';

const validEnv: WorkerEnv = {
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
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const validIfthenpayEnv: WorkerEnv = {
  ...validEnv,
  PAYMENT_PRIMARY_PROVIDER: 'ifthenpay',
  IFTHENPAY_API_KEY: 'ifthenpay-api-key',
  IFTHENPAY_WEBHOOK_SECRET: 'ifthenpay-anti-phishing-key',
};

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe('worker health boundary', () => {
  it('returns health status when environment config is valid', async () => {
    const response = await handleWorkerRequest(new Request('https://worker.test/health'), validEnv);

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({
      status: 'ok',
      service: 'pic4paws',
      environment: 'production',
    });
  });

  it('returns safe configuration errors without leaking secrets', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/health'),
      {
        ...validEnv,
        SUPABASE_URL: 'not-a-url',
        SUPABASE_SERVICE_ROLE_KEY: 'super-secret-value',
        R2_SECRET_ACCESS_KEY: '',
      },
    );

    expect(response.status).toBe(500);
    const body = await json(response);

    expect(body).toEqual({
      status: 'configuration_error',
      errors: [
        { path: 'SUPABASE_URL', message: 'Invalid URL' },
        { path: 'R2_SECRET_ACCESS_KEY', message: 'Required' },
      ],
    });
    expect(JSON.stringify(body)).not.toContain('super-secret-value');
  });
});

describe('worker payment webhook boundary', () => {
  it('uses the validated environment webhook path and rejects GET for POST providers', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments'),
      { ...validEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
    await expect(json(response)).resolves.toEqual({
      status: 'method_not_allowed',
      allowedMethods: ['POST'],
    });
  });

  it('allows GET for Ifthenpay callbacks and reaches verifier composition', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments?key=ifthenpay-anti-phishing-key'),
      { ...validIfthenpayEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(501);
    await expect(json(response)).resolves.toEqual({
      status: 'payment_webhook_verifier_not_configured',
      provider: 'ifthenpay',
    });
  });

  it('rejects POST for Ifthenpay callbacks', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments', {
        method: 'POST',
        body: '{}',
      }),
      { ...validIfthenpayEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET');
    await expect(json(response)).resolves.toEqual({
      status: 'method_not_allowed',
      allowedMethods: ['GET'],
    });
  });

  it('reads raw body and defers to verifier — non-JSON body still reaches 501 without adapter', async () => {
    // The webhook handler reads the raw body as text for signature verification.
    // Without a PaymentWebhookVerifier injected, any body (even non-JSON) → 501.
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments', {
        method: 'POST',
        body: '{not-json',
      }),
      { ...validEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(501);
    await expect(json(response)).resolves.toEqual({
      status: 'payment_webhook_verifier_not_configured',
      provider: 'eupago',
    });
  });

  it('blocks payment webhooks by default until provider verification is operationally enabled', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments', {
        method: 'POST',
        body: JSON.stringify({ providerEventId: 'evt-1', status: 'paid' }),
      }),
      validEnv,
    );

    expect(response.status).toBe(503);
    await expect(json(response)).resolves.toEqual({
      status: 'payment_webhooks_disabled',
      provider: 'eupago',
    });
  });

  it('does not silently fall back to provider_adapter_not_configured when enabled without verifier', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments', {
        method: 'POST',
        body: JSON.stringify({ providerEventId: 'evt-1', status: 'paid' }),
      }),
      { ...validEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(501);
    await expect(json(response)).resolves.toEqual({
      status: 'payment_webhook_verifier_not_configured',
      provider: 'eupago',
    });
  });
});
