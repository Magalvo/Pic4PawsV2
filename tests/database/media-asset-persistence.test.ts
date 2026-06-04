import { describe, expect, it } from 'vitest';
import { parseEnvironmentConfig, type EnvironmentRecord } from '../../packages/config/src/index';
import { createMediaAssetInsertFromUploadIntent } from '../../packages/database/src/index';
import {
  createWorkerMediaUploadIntent,
  type MediaUploadSigner,
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

const getConfig = () => {
  const parsed = parseEnvironmentConfig(validEnv);

  expect(parsed.ok).toBe(true);
  if (!parsed.ok) {
    throw new Error('Expected valid config');
  }

  return parsed.config;
};

describe('media asset persistence contract', () => {
  it('maps signed upload intents to media_assets insert contracts', async () => {
    const signer: MediaUploadSigner = async () => ({
      signedUrl: 'https://uploads.test/signed/media-1',
      expiresAt: '2026-06-04T12:45:00.000Z',
    });

    const uploadIntent = await createWorkerMediaUploadIntent({
      payload: validUploadPayload,
      config: getConfig(),
      now: '2026-06-04T12:30:00.000Z',
      signer,
    });

    expect(uploadIntent.ok).toBe(true);
    if (!uploadIntent.ok) {
      return;
    }

    expect(createMediaAssetInsertFromUploadIntent(uploadIntent.intent)).toEqual({
      ok: true,
      insert: {
        id: 'media-1',
        ownerUserId: 'user-a',
        shelterId: 'shelter-a',
        r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        mimeType: 'image/jpeg',
        visibility: 'public',
        width: null,
        height: null,
        derivativeMetadata: {
          byteSize: 1_200_000,
          bucketName: 'pic4paws-public',
          mediaKind: 'image',
          uploadStatus: 'signed',
          signedUrlPersisted: false,
        },
        createdAt: '2026-06-04T12:30:00.000Z',
        updatedAt: '2026-06-04T12:30:00.000Z',
        deletedAt: null,
      },
    });
  });

  it('does not persist signed URLs or expiry values', async () => {
    const signer: MediaUploadSigner = async () => ({
      signedUrl: 'https://uploads.test/signed/media-1?secret=temporary',
      expiresAt: '2026-06-04T12:45:00.000Z',
    });

    const uploadIntent = await createWorkerMediaUploadIntent({
      payload: validUploadPayload,
      config: getConfig(),
      now: '2026-06-04T12:30:00.000Z',
      signer,
    });

    expect(uploadIntent.ok).toBe(true);
    if (!uploadIntent.ok) {
      return;
    }

    const result = createMediaAssetInsertFromUploadIntent(uploadIntent.intent);

    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toContain('https://uploads.test');
    expect(JSON.stringify(result)).not.toContain('2026-06-04T12:45:00.000Z');
    expect(JSON.stringify(result)).not.toContain('temporary');
  });

  it('rejects unsigned upload intents', () => {
    expect(
      createMediaAssetInsertFromUploadIntent({
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
      }),
    ).toEqual({
      ok: false,
      reasons: ['upload_not_signed'],
    });
  });

  it('rejects upload intents without owner or shelter scope', () => {
    expect(
      createMediaAssetInsertFromUploadIntent({
        status: 'upload_ready',
        mediaId: 'media-1',
        bucketName: 'pic4paws-public',
        objectKey: 'public/users/unknown/pet_public_image/media-1.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_200_000,
        visibility: 'public',
        mediaKind: 'image',
        ownerUserId: null,
        shelterId: null,
        signedUrl: 'https://uploads.test/signed/media-1',
        expiresAt: '2026-06-04T12:45:00.000Z',
        dryRunOnly: false,
        createdAt: '2026-06-04T12:30:00.000Z',
      }),
    ).toEqual({
      ok: false,
      reasons: ['missing_owner_or_shelter_scope'],
    });
  });
});
