import { describe, expect, it } from 'vitest';
import { parseEnvironmentConfig, type EnvironmentRecord } from '../../packages/config/src/index';
import {
  createWorkerMediaUploadIntent,
  handleWorkerRequest,
  type MediaUploadSigner,
  type MediaUploadSignerInput,
} from '../../apps/workers/src/index';

const validEnv: EnvironmentRecord = {
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
  WORKER_MEDIA_UPLOAD_PATH: '/uploads/media',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const developmentEnv: EnvironmentRecord = {
  ...validEnv,
  APP_ENV: 'development',
};

const validUploadPayload = {
  mediaId: 'media-1',
  purpose: 'pet_public_image',
  requestedVisibility: 'public',
  mimeType: 'image/jpeg',
  byteSize: 1_200_000,
  ownerUserId: 'user-a',
  shelterId: 'shelter-a',
  originalFilename: 'becas.jpg',
};

const getConfig = (env: EnvironmentRecord = validEnv) => {
  const parsed = parseEnvironmentConfig(env);

  expect(parsed.ok).toBe(true);
  if (!parsed.ok) {
    throw new Error('Expected valid config');
  }

  return parsed.config;
};

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe('injectable media upload signer', () => {
  it('passes deterministic R2 upload metadata into an injected signer', async () => {
    const receivedInputs: MediaUploadSignerInput[] = [];
    const signer: MediaUploadSigner = async (input) => {
      receivedInputs.push(input);

      return {
        signedUrl: `https://uploads.test/${input.bucketName}/${input.objectKey}`,
        expiresAt: '2026-06-04T12:45:00.000Z',
      };
    };

    const result = await createWorkerMediaUploadIntent({
      payload: validUploadPayload,
      config: getConfig(),
      now: '2026-06-04T12:30:00.000Z',
      signer,
    });

    expect(receivedInputs).toEqual([
      {
        bucketName: 'pic4paws-public',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_200_000,
        visibility: 'public',
        expiresInSeconds: 900,
      },
    ]);
    expect(result).toEqual({
      ok: true,
      intent: {
        status: 'upload_ready',
        mediaId: 'media-1',
        bucketName: 'pic4paws-public',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_200_000,
        visibility: 'public',
        mediaKind: 'image',
        ownerUserId: 'user-a',
        shelterId: 'shelter-a',
        signedUrl:
          'https://uploads.test/pic4paws-public/public/shelters/shelter-a/pet_public_image/media-1.jpg',
        expiresAt: '2026-06-04T12:45:00.000Z',
        dryRunOnly: false,
        createdAt: '2026-06-04T12:30:00.000Z',
      },
    });
  });

  it('keeps the no-signer fallback explicit', async () => {
    const result = await createWorkerMediaUploadIntent({
      payload: validUploadPayload,
      config: getConfig(developmentEnv),
      now: '2026-06-04T12:30:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.intent.status).toBe('upload_signer_not_configured');
    expect(result.ok && result.intent.signedUrl).toBeNull();
  });

  it('returns safe signer failures without leaking thrown messages', async () => {
    const signer: MediaUploadSigner = async () => {
      throw new Error('r2-secret-key leaked by adapter');
    };

    const result = await createWorkerMediaUploadIntent({
      payload: validUploadPayload,
      config: getConfig(),
      now: '2026-06-04T12:30:00.000Z',
      signer,
    });

    expect(result).toEqual({
      ok: false,
      status: 'upload_signer_failed',
      reasons: ['signer_unavailable'],
    });
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
  });

  it('requires authentication before returning upload_ready from the Worker route boundary', async () => {
    const signerCalls: string[] = [];
    const signer: MediaUploadSigner = async () => {
      signerCalls.push('called');
      return {
        signedUrl: 'https://uploads.test/signed/media-1',
        expiresAt: '2026-06-04T12:45:00.000Z',
      };
    };

    const response = await handleWorkerRequest(
      new Request('https://worker.test/uploads/media', {
        method: 'POST',
        body: JSON.stringify(validUploadPayload),
      }),
      validEnv,
      {
        mediaUploadSigner: signer,
        now: () => '2026-06-04T12:30:00.000Z',
      },
    );

    expect(response.status).toBe(401);
    await expect(json(response)).resolves.toEqual({ status: 'unauthenticated' });
    expect(signerCalls).toEqual([]);
  });

  it('uses injected signer dependencies after Worker route authentication succeeds', async () => {
    const signer: MediaUploadSigner = async () => ({
      signedUrl: 'https://uploads.test/signed/media-1',
      expiresAt: '2026-06-04T12:45:00.000Z',
    });

    const response = await handleWorkerRequest(
      new Request('https://worker.test/uploads/media', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(validUploadPayload),
      }),
      validEnv,
      {
        mediaUploadSigner: signer,
        petDraftAuthenticator: async () => ({
          id: 'user-a',
          authUserId: 'auth-user-a',
          role: 'adopter',
          status: 'active',
          memberships: [],
        }),
        now: () => '2026-06-04T12:30:00.000Z',
      },
    );

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toMatchObject({
      status: 'upload_ready',
      mediaId: 'media-1',
      signedUrl: 'https://uploads.test/signed/media-1',
      expiresAt: '2026-06-04T12:45:00.000Z',
      dryRunOnly: false,
    });
  });
});
