import { describe, expect, it } from 'vitest';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { MediaAssetInsertContract } from '@pic4paws/database';
import {
  handleWorkerRequest,
  type MediaAssetRepository,
  type MediaUploadSigner,
} from '../../apps/workers/src/index';
import type { EnvironmentRecord } from '../../packages/config/src/index';

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

const shelterActor: AuthenticatedActor = {
  id: 'user-a',
  authUserId: 'auth-user-a',
  role: 'shelter_member',
  status: 'active',
  memberships: [
    {
      id: 'membership-a',
      userId: 'user-a',
      shelterId: 'shelter-a',
      role: 'shelter_member',
      deletedAt: null,
    },
  ],
};

const outsiderActor: AuthenticatedActor = {
  ...shelterActor,
  id: 'user-b',
  authUserId: 'auth-user-b',
  memberships: [
    {
      id: 'membership-b',
      userId: 'user-b',
      shelterId: 'shelter-b',
      role: 'shelter_member',
      deletedAt: null,
    },
  ],
};

const signer: MediaUploadSigner = async () => ({
  signedUrl: 'https://uploads.test/signed/media-1?temporary=secret',
  expiresAt: '2026-06-05T12:45:00.000Z',
});

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

const uploadRequest = (authorizationHeader = 'Bearer test-token') =>
  new Request('https://worker.test/uploads/media', {
    method: 'POST',
    headers: {
      Authorization: authorizationHeader,
    },
    body: JSON.stringify(validUploadPayload),
  });

describe('authenticated media upload persistence', () => {
  it('persists signed media asset inserts without saving signed URLs or expiry values', async () => {
    const saved: Array<{ insert: MediaAssetInsertContract; actor: AuthenticatedActor }> = [];
    const mediaAssetRepository: MediaAssetRepository = {
      saveMediaAsset: async (insert, actor) => {
        saved.push({ insert, actor });

        return { mediaAssetId: insert.id };
      },
    };

    const response = await handleWorkerRequest(uploadRequest(), validEnv, {
      mediaUploadSigner: signer,
      mediaAssetRepository,
      petDraftAuthenticator: async () => shelterActor,
      now: () => '2026-06-05T12:30:00.000Z',
    });

    expect(response.status).toBe(201);
    await expect(json(response)).resolves.toMatchObject({
      status: 'upload_ready',
      mediaId: 'media-1',
      mediaAssetId: 'media-1',
      mediaAssetPersisted: true,
      signedUrl: 'https://uploads.test/signed/media-1?temporary=secret',
      expiresAt: '2026-06-05T12:45:00.000Z',
    });
    expect(saved).toEqual([
      {
        actor: shelterActor,
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
          createdAt: '2026-06-05T12:30:00.000Z',
          updatedAt: '2026-06-05T12:30:00.000Z',
          deletedAt: null,
        },
      },
    ]);
    expect(JSON.stringify(saved)).not.toContain('https://uploads.test');
    expect(JSON.stringify(saved)).not.toContain('2026-06-05T12:45:00.000Z');
    expect(JSON.stringify(saved)).not.toContain('temporary=secret');
  });

  it('requires authentication before repository persistence', async () => {
    const mediaAssetRepository: MediaAssetRepository = {
      saveMediaAsset: async () => {
        throw new Error('repository should not be called');
      },
    };

    const response = await handleWorkerRequest(
      uploadRequest(''),
      validEnv,
      {
        mediaUploadSigner: signer,
        mediaAssetRepository,
        petDraftAuthenticator: async () => shelterActor,
      },
    );

    expect(response.status).toBe(401);
    await expect(json(response)).resolves.toEqual({ status: 'unauthenticated' });
  });

  it('rejects actors that cannot manage the requested shelter scope', async () => {
    const mediaAssetRepository: MediaAssetRepository = {
      saveMediaAsset: async () => {
        throw new Error('repository should not be called');
      },
    };

    const response = await handleWorkerRequest(uploadRequest(), validEnv, {
      mediaUploadSigner: signer,
      mediaAssetRepository,
      petDraftAuthenticator: async () => outsiderActor,
    });

    expect(response.status).toBe(403);
    await expect(json(response)).resolves.toEqual({
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });
  });

  it('returns sanitized persistence failures without leaking provider or bearer details', async () => {
    const mediaAssetRepository: MediaAssetRepository = {
      saveMediaAsset: async () => {
        throw new Error('service-role-secret r2-secret-key Bearer test-token');
      },
    };

    const response = await handleWorkerRequest(uploadRequest(), validEnv, {
      mediaUploadSigner: signer,
      mediaAssetRepository,
      petDraftAuthenticator: async () => shelterActor,
    });
    const body = await json(response);

    expect(response.status).toBe(502);
    expect(body).toEqual({
      status: 'media_asset_persistence_failed',
      reasons: ['media_asset_repository_unavailable'],
    });
    expect(JSON.stringify(body)).not.toMatch(/service-role-secret|r2-secret-key|Bearer test-token/);
  });

  it('keeps signed upload responses working when no repository is injected', async () => {
    const response = await handleWorkerRequest(uploadRequest(), validEnv, {
      mediaUploadSigner: signer,
      petDraftAuthenticator: async () => shelterActor,
      now: () => '2026-06-05T12:30:00.000Z',
    });

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toMatchObject({
      status: 'upload_ready',
      mediaId: 'media-1',
      signedUrl: 'https://uploads.test/signed/media-1?temporary=secret',
      dryRunOnly: false,
    });
  });
});
