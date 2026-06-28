import { describe, expect, it } from 'vitest';
import { parseEnvironmentConfig, type EnvironmentRecord } from '../../packages/config/src/index';
import { createWorkerMediaUploadIntent, handleWorkerRequest } from '../../apps/workers/src/index';

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

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe('worker media upload request contract', () => {
  it('parses the configured media upload path', () => {
    const parsed = parseEnvironmentConfig(developmentEnv);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.config.workers.mediaUploadPath).toBe('/uploads/media');
  });

  it('creates dry-run upload intent metadata without real signed URLs', async () => {
    const parsed = parseEnvironmentConfig(developmentEnv);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    await expect(
      createWorkerMediaUploadIntent({
        payload: validUploadPayload,
        config: parsed.config,
        now: '2026-06-04T12:30:00.000Z',
      }),
    ).resolves.toEqual({
      ok: true,
      intent: {
        status: 'upload_signer_not_configured',
        mediaId: 'media-1',
        bucketName: 'pic4paws-public',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_200_000,
        visibility: 'public',
        mediaKind: 'image',
        ownerUserId: 'user-a',
        shelterId: 'shelter-a',
        signedUrl: null,
        dryRunOnly: true,
        createdAt: '2026-06-04T12:30:00.000Z',
      },
    });
  });

  it('rejects invalid upload payloads with media policy reasons', async () => {
    const parsed = parseEnvironmentConfig(validEnv);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    await expect(
      createWorkerMediaUploadIntent({
        payload: {
          ...validUploadPayload,
          mimeType: 'text/html',
          byteSize: 0,
          ownerUserId: null,
          shelterId: null,
        },
        config: parsed.config,
        now: '2026-06-04T12:30:00.000Z',
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'invalid_upload_request',
      reasons: ['unsupported_mime_type', 'invalid_byte_size', 'missing_owner_or_shelter_scope'],
    });
  });

  it('rejects non-POST requests on the configured upload path', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/uploads/media'),
      validEnv,
    );

    expect(response.status).toBe(405);
    await expect(json(response)).resolves.toEqual({
      status: 'method_not_allowed',
      allowedMethods: ['POST'],
    });
  });

  it('rejects invalid JSON request bodies', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/uploads/media', {
        method: 'POST',
        body: '{not-json',
      }),
      validEnv,
    );

    expect(response.status).toBe(400);
    await expect(json(response)).resolves.toEqual({ status: 'invalid_json' });
  });

  it('returns dry-run upload intent responses for valid requests', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/uploads/media', {
        method: 'POST',
        body: JSON.stringify(validUploadPayload),
      }),
      developmentEnv,
    );

    expect(response.status).toBe(501);
    const body = await json(response);

    expect(body).toMatchObject({
      status: 'upload_signer_not_configured',
      mediaId: 'media-1',
      bucketName: 'pic4paws-public',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
      contentType: 'image/jpeg',
      byteSize: 1_200_000,
      visibility: 'public',
      signedUrl: null,
      dryRunOnly: true,
    });
    expect(typeof body.createdAt).toBe('string');
    expect(JSON.stringify(body)).not.toContain('r2-secret-key');
    expect(JSON.stringify(body)).not.toContain('service-role-secret');
  });

  it('rejects production dry-runs when no upload signer is configured', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/uploads/media', {
        method: 'POST',
        body: JSON.stringify(validUploadPayload),
      }),
      validEnv,
    );

    expect(response.status).toBe(501);
    await expect(json(response)).resolves.toEqual({
      status: 'upload_signer_not_configured',
      reasons: ['signed_upload_requires_configured_signer'],
    });
  });

  it('accepts donation_receipt as a valid purpose', async () => {
    const parsed = parseEnvironmentConfig(developmentEnv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = await createWorkerMediaUploadIntent({
      payload: { ...validUploadPayload, purpose: 'donation_receipt', requestedVisibility: 'private' },
      config: parsed.config,
      now: '2026-06-28T00:00:00.000Z',
    });

    // donation_receipt is a valid purpose — invalid_purpose must not appear
    if (!result.ok) {
      expect(result.reasons).not.toContain('invalid_purpose');
    }
  });
});
