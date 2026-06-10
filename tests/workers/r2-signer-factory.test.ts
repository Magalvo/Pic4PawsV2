import { describe, expect, it } from 'vitest';
import {
  createR2UploadSigner,
  createR2UploadSignerWorkerDependencies,
  R2UploadSignerFactoryError,
  type R2UploadPresignerInput,
} from '../../apps/workers/src/index';
import type { EnvironmentConfig } from '../../packages/config/src/index';

const validConfig: EnvironmentConfig = {
  app: {
    environment: 'development',
    publicAppOrigin: 'https://app.pic4paws.test',
  },
  supabase: {
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    serviceRoleKey: 'service-role-key',
  },
  cloudflare: {
    accountId: 'cloudflare-account',
    r2PublicBucket: 'pic4paws-public',
    r2PrivateBucket: 'pic4paws-private',
    r2AccessKeyId: 'r2-access-key',
    r2SecretAccessKey: 'r2-secret-key',
  },
  workers: {
    paymentWebhookPath: '/webhooks/payments',
    mediaUploadPath: '/uploads/media',
    petDraftsPath: '/pets/drafts',
    petFeedPath: '/pets',
    shelterPath: '/shelters',
    adoptionsPath: '/adoptions',
    donationsPath: '/donations',
    sponsorshipsPath: '/sponsorships',
    notificationsPath: '/notifications',
  },
  payments: {
    primaryProvider: 'stripe',
    eupagoApiKey: null,
    eupagoWebhookSecret: null,
    ifthenpayApiKey: null,
    ifthenpayWebhookSecret: null,
    stripeSecretKey: 'stripe-secret',
    stripeWebhookSecret: 'stripe-webhook-secret',
  },
};

describe('R2 upload signer factory', () => {
  it('creates signed PUT upload URLs with R2 endpoint, credentials and media metadata', async () => {
    const receivedInputs: R2UploadPresignerInput[] = [];
    const signer = createR2UploadSigner({
      config: validConfig,
      now: () => new Date('2026-06-05T12:00:00.000Z'),
      presignUpload: async (input) => {
        receivedInputs.push(input);

        return {
          signedUrl: `https://uploads.test/${input.bucketName}/${input.objectKey}`,
        };
      },
    });

    await expect(
      signer({
        bucketName: 'pic4paws-public',
        objectKey: 'public/pets/media-1/original.jpg',
        contentType: 'image/jpeg',
        byteSize: 1024,
        visibility: 'public',
        expiresInSeconds: 900,
      }),
    ).resolves.toEqual({
      signedUrl: 'https://uploads.test/pic4paws-public/public/pets/media-1/original.jpg',
      expiresAt: '2026-06-05T12:15:00.000Z',
    });
    expect(receivedInputs).toEqual([
      {
        endpoint: 'https://cloudflare-account.r2.cloudflarestorage.com',
        region: 'auto',
        accessKeyId: 'r2-access-key',
        secretAccessKey: 'r2-secret-key',
        bucketName: 'pic4paws-public',
        objectKey: 'public/pets/media-1/original.jpg',
        contentType: 'image/jpeg',
        byteSize: 1024,
        expiresInSeconds: 900,
      },
    ]);
  });

  it('creates Worker dependencies containing a media upload signer', async () => {
    const dependencies = createR2UploadSignerWorkerDependencies({
      config: validConfig,
      now: () => new Date('2026-06-05T12:00:00.000Z'),
      presignUpload: async () => ({ signedUrl: 'https://uploads.test/signed' }),
    });

    expect(dependencies.mediaUploadSigner).toBeDefined();
    await expect(
      dependencies.mediaUploadSigner?.({
        bucketName: 'pic4paws-private',
        objectKey: 'private/documents/media-1/document.pdf',
        contentType: 'application/pdf',
        byteSize: 2048,
        visibility: 'private',
        expiresInSeconds: 300,
      }),
    ).resolves.toEqual({
      signedUrl: 'https://uploads.test/signed',
      expiresAt: '2026-06-05T12:05:00.000Z',
    });
  });

  it('throws sanitized errors without leaking R2 credentials or provider payloads', async () => {
    const signer = createR2UploadSigner({
      config: validConfig,
      presignUpload: async () => {
        throw new Error('r2-access-key r2-secret-key provider payload');
      },
    });

    await expect(
      signer({
        bucketName: 'pic4paws-private',
        objectKey: 'private/documents/media-1/document.pdf',
        contentType: 'application/pdf',
        byteSize: 2048,
        visibility: 'private',
        expiresInSeconds: 900,
      }),
    ).rejects.toThrow(new R2UploadSignerFactoryError('Failed to create R2 upload signature'));
    await expect(
      signer({
        bucketName: 'pic4paws-private',
        objectKey: 'private/documents/media-1/document.pdf',
        contentType: 'application/pdf',
        byteSize: 2048,
        visibility: 'private',
        expiresInSeconds: 900,
      }),
    ).rejects.not.toThrow(/r2-access-key|r2-secret-key|provider payload/);
  });
});
