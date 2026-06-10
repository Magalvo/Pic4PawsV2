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

describe('Worker dispatcher error boundary', () => {
  it('returns 500 internal_server_error when a sync repository throw escapes a route handler', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets'),
      validEnv,
      {
        petFeedRepository: {
          loadPublishedPets: () => { throw new Error('unexpected database failure'); },
        },
      },
    );

    expect(response.status).toBe(500);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('internal_server_error');
  });

  it('returns 500 internal_server_error when an async repository rejection escapes a route handler', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets'),
      validEnv,
      {
        petFeedRepository: {
          loadPublishedPets: async () => { throw new Error('async db crash'); },
        },
      },
    );

    expect(response.status).toBe(500);
    const body = await response.json() as Record<string, unknown>;
    expect(body.status).toBe('internal_server_error');
  });

  it('does not leak the error message in the response body', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets'),
      validEnv,
      {
        petFeedRepository: {
          loadPublishedPets: () => { throw new Error('super-secret-internal-detail'); },
        },
      },
    );

    const body = JSON.stringify(await response.json());
    expect(body).not.toContain('super-secret-internal-detail');
  });

  it('response body is valid JSON with only status field', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets'),
      validEnv,
      {
        petFeedRepository: {
          loadPublishedPets: () => { throw new Error('crash'); },
        },
      },
    );

    const body = await response.json() as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(['status']);
    expect(body.status).toBe('internal_server_error');
  });
});
