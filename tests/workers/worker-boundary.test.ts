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
  it('eupago route rejects GET → 405', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments/eupago'),
      { ...validEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
    await expect(json(response)).resolves.toEqual({
      status: 'method_not_allowed',
      allowedMethods: ['POST'],
    });
  });

  it('ifthenpay route rejects POST → 405', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments/ifthenpay', {
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

  it('eupago route blocks when webhooks are disabled → 503', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments/eupago', {
        method: 'POST',
        body: JSON.stringify({ transactionId: 'txn-1' }),
      }),
      validEnv,
    );

    expect(response.status).toBe(503);
    await expect(json(response)).resolves.toEqual({
      status: 'payment_webhooks_disabled',
      provider: 'eupago',
    });
  });

  it('ifthenpay route blocks when webhooks are disabled → 503', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments/ifthenpay?key=k&requestId=r'),
      validIfthenpayEnv,
    );

    expect(response.status).toBe(503);
    await expect(json(response)).resolves.toEqual({
      status: 'payment_webhooks_disabled',
      provider: 'ifthenpay',
    });
  });

  it('eupago route with non-JSON body → 401 (cannot extract transactionId)', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments/eupago', {
        method: 'POST',
        body: '{not-json',
      }),
      { ...validEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(401);
    await expect(json(response)).resolves.toEqual({
      status: 'webhook_signature_invalid',
    });
  });

  it('legacy GET /webhooks/payments → 410 gone', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/webhooks/payments'),
      { ...validEnv, PAYMENT_WEBHOOKS_ENABLED: 'true' },
    );

    expect(response.status).toBe(410);
    await expect(json(response)).resolves.toMatchObject({ status: 'gone' });
  });
});
