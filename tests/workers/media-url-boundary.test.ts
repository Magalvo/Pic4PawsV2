import { describe, expect, it } from 'vitest';
import { parseEnvironmentConfig, type EnvironmentRecord } from '../../packages/config/src/index';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  MediaAssetReadRepository,
  MediaDownloadSigner,
} from '../../apps/workers/src/index';

const baseEnv: EnvironmentRecord = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cf-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_MEDIA_URL_PATH: '/media',
  PAYMENT_PRIMARY_PROVIDER: 'stripe',
  STRIPE_SECRET_KEY: 'sk_test_key',
  STRIPE_WEBHOOK_SECRET: 'stripe-webhook-secret',
};

const makeRequest = (url: string, method = 'GET') =>
  new Request(url, { method });

const publicAssetRepo = (objectKey = 'public/test.jpg'): MediaAssetReadRepository => ({
  getMediaAsset: async () => ({ objectKey, visibility: 'public' }),
});

const privateAssetRepo = (): MediaAssetReadRepository => ({
  getMediaAsset: async () => ({ objectKey: 'private/doc.pdf', visibility: 'private' }),
});

const nullAssetRepo = (): MediaAssetReadRepository => ({
  getMediaAsset: async () => null,
});

const mockSigner = (): MediaDownloadSigner =>
  async () => ({ url: 'https://signed.r2.dev/test.jpg', expiresAt: '2026-06-29T12:15:00.000Z' });

const json = (res: Response) => res.json() as Promise<Record<string, unknown>>;

describe('media URL route', () => {
  it('parses WORKER_MEDIA_URL_PATH from env', () => {
    const result = parseEnvironmentConfig(baseEnv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.workers.mediaUrlPath).toBe('/media');
  });

  it('returns 404 when media asset is not found', async () => {
    const response = await handleWorkerRequest(
      makeRequest('https://worker.example.com/media/missing-id/url'),
      baseEnv,
      { mediaAssetReadRepository: nullAssetRepo(), mediaDownloadSigner: mockSigner() },
    );

    expect(response.status).toBe(404);
    const body = await json(response);
    expect(body.status).toBe('not_found');
  });

  it('returns 403 when media asset visibility is private', async () => {
    const response = await handleWorkerRequest(
      makeRequest('https://worker.example.com/media/private-id/url'),
      baseEnv,
      { mediaAssetReadRepository: privateAssetRepo(), mediaDownloadSigner: mockSigner() },
    );

    expect(response.status).toBe(403);
    const body = await json(response);
    expect(body.status).toBe('forbidden');
  });

  it('returns 501 when no download signer is configured', async () => {
    const response = await handleWorkerRequest(
      makeRequest('https://worker.example.com/media/media-id/url'),
      baseEnv,
      { mediaAssetReadRepository: publicAssetRepo() },
    );

    expect(response.status).toBe(501);
    const body = await json(response);
    expect(body.status).toBe('download_signer_not_configured');
  });

  it('returns 200 with signed URL when fully configured', async () => {
    const response = await handleWorkerRequest(
      makeRequest('https://worker.example.com/media/media-id/url'),
      baseEnv,
      { mediaAssetReadRepository: publicAssetRepo(), mediaDownloadSigner: mockSigner() },
    );

    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.url).toBe('https://signed.r2.dev/test.jpg');
    expect(body.expiresAt).toBe('2026-06-29T12:15:00.000Z');
    expect(body.mediaId).toBe('media-id');
  });

  it('returns 405 for non-GET methods on the URL route', async () => {
    const response = await handleWorkerRequest(
      makeRequest('https://worker.example.com/media/media-id/url', 'POST'),
      baseEnv,
      { mediaAssetReadRepository: publicAssetRepo(), mediaDownloadSigner: mockSigner() },
    );

    expect(response.status).toBe(405);
  });

  it('does not match paths without /url suffix', async () => {
    const response = await handleWorkerRequest(
      makeRequest('https://worker.example.com/media/media-id'),
      baseEnv,
      { mediaAssetReadRepository: publicAssetRepo(), mediaDownloadSigner: mockSigner() },
    );

    expect(response.status).toBe(404);
  });

  it('does not leak auth markers in error responses', async () => {
    const response = await handleWorkerRequest(
      makeRequest('https://worker.example.com/media/missing/url'),
      baseEnv,
      { mediaAssetReadRepository: nullAssetRepo(), mediaDownloadSigner: mockSigner() },
    );

    const body = JSON.stringify(await json(response));
    expect(body).not.toContain('service-role');
    expect(body).not.toContain('bearer');
  });
});
