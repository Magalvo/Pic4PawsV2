import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type { PetFeedRepository, PetFeedResult } from '../../apps/workers/src/index';
import type { EnvironmentRecord } from '@pic4paws/config';

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
  WORKER_PET_DRAFTS_PATH: '/pets/drafts',
  WORKER_PET_FEED_PATH: '/pets',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const makeFeedRepo = (result: PetFeedResult): PetFeedRepository => ({
  loadPublishedPets: vi.fn().mockResolvedValue(result),
});

const samplePet = {
  id: 'pet-published-1',
  shelterId: 'shelter-a',
  name: 'Bobi',
  species: 'dog' as const,
  locationLabel: 'Porto',
  shortDescription: 'Amigável e brincalhão.',
  heroMediaId: 'media-1',
  mediaIds: ['media-1', 'media-2'],
  publishedAt: '2026-06-01T10:00:00.000Z',
};

describe('GET /pets — pet feed', () => {
  it('returns 200 with pets array and total when repository returns pets', async () => {
    const repo = makeFeedRepo({ pets: [samplePet], total: 1 });
    const request = new Request('https://workers.pic4paws.pt/pets');

    const response = await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', pets: [samplePet], total: 1 });
  });

  it('passes species filter to the repository', async () => {
    const repo = makeFeedRepo({ pets: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/pets?species=dog');

    await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });

    expect(repo.loadPublishedPets).toHaveBeenCalledWith(
      expect.objectContaining({ species: 'dog', limit: 20, offset: 0 }),
    );
  });

  it('passes limit and offset to the repository', async () => {
    const repo = makeFeedRepo({ pets: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/pets?limit=5&offset=10');

    await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });

    expect(repo.loadPublishedPets).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5, offset: 10 }),
    );
  });

  it('clamps limit to 50 when limit=200 is requested', async () => {
    const repo = makeFeedRepo({ pets: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/pets?limit=200');

    await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });

    expect(repo.loadPublishedPets).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );
  });

  it('treats an invalid species value as absent', async () => {
    const repo = makeFeedRepo({ pets: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/pets?species=invalid_value');

    await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });

    expect(repo.loadPublishedPets).toHaveBeenCalledWith(
      expect.objectContaining({ species: null }),
    );
  });

  it('returns 501 when petFeedRepository is not injected', async () => {
    const request = new Request('https://workers.pic4paws.pt/pets');

    const response = await handleWorkerRequest(request, validEnv, {});
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('pet_feed_repository_not_configured');
  });

  it('returns 405 for POST /pets', async () => {
    const repo = makeFeedRepo({ pets: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/pets', { method: 'POST' });

    const response = await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
    expect(body.allowedMethods).toEqual(['GET']);
  });

  it('returns 200 with empty array when repository returns no pets', async () => {
    const repo = makeFeedRepo({ pets: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/pets');

    const response = await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', pets: [], total: 0 });
  });

  it('response body never contains draft status values or credential markers', async () => {
    const repo = makeFeedRepo({ pets: [samplePet], total: 1 });
    const request = new Request('https://workers.pic4paws.pt/pets');

    const response = await handleWorkerRequest(request, validEnv, { petFeedRepository: repo });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('"draft"');
    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
