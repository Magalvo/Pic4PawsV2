import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  ShelterSearchRepository,
  ShelterSearchResult,
  PublicShelterSummary,
} from '../../apps/workers/src/index';
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
  WORKER_SHELTER_PATH: '/shelters',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const sampleShelter: PublicShelterSummary = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter',
  verificationStatus: 'verified',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  logoMediaId: 'logo-media-1',
};

const makeSearchRepo = (result: ShelterSearchResult): ShelterSearchRepository => ({
  searchShelters: vi.fn().mockResolvedValue(result),
});

describe('GET /shelters — shelter search', () => {
  it('returns 200 with shelters array and total when repository returns results', async () => {
    const repo = makeSearchRepo({ shelters: [sampleShelter], total: 1 });
    const request = new Request('https://workers.pic4paws.pt/shelters');

    const response = await handleWorkerRequest(request, validEnv, {
      shelterSearchRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', shelters: [sampleShelter], total: 1 });
  });

  it('returns 200 with empty array when no shelters exist', async () => {
    const repo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters');

    const response = await handleWorkerRequest(request, validEnv, {
      shelterSearchRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', shelters: [], total: 0 });
  });

  it('passes default limit 20 and offset 0 when no query params provided', async () => {
    const repo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters');

    await handleWorkerRequest(request, validEnv, { shelterSearchRepository: repo });

    expect(repo.searchShelters).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
  });

  it('passes limit and offset to the repository', async () => {
    const repo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters?limit=5&offset=10');

    await handleWorkerRequest(request, validEnv, { shelterSearchRepository: repo });

    expect(repo.searchShelters).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5, offset: 10 }),
    );
  });

  it('clamps limit to 50 when limit=200 is requested', async () => {
    const repo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters?limit=200');

    await handleWorkerRequest(request, validEnv, { shelterSearchRepository: repo });

    expect(repo.searchShelters).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );
  });

  it('passes kind filter to repository when kind= param provided', async () => {
    const repo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters?kind=sanctuary');

    await handleWorkerRequest(request, validEnv, { shelterSearchRepository: repo });

    expect(repo.searchShelters).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'sanctuary' }),
    );
  });

  it('passes null kind when an invalid kind value is provided', async () => {
    const repo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters?kind=invalid_kind');

    await handleWorkerRequest(request, validEnv, { shelterSearchRepository: repo });

    expect(repo.searchShelters).toHaveBeenCalledWith(
      expect.objectContaining({ kind: null }),
    );
  });

  it('returns 405 for POST /shelters', async () => {
    const repo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters', { method: 'POST' });

    const response = await handleWorkerRequest(request, validEnv, {
      shelterSearchRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
    expect(body.allowedMethods).toEqual(['GET']);
  });

  it('returns 501 when shelterSearchRepository is not injected', async () => {
    const request = new Request('https://workers.pic4paws.pt/shelters');

    const response = await handleWorkerRequest(request, validEnv, {});
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('shelter_search_repository_not_configured');
  });

  it('does not route /shelters/shelter-a to the search handler', async () => {
    const searchRepo = makeSearchRepo({ shelters: [], total: 0 });
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a');

    await handleWorkerRequest(request, validEnv, { shelterSearchRepository: searchRepo });

    expect(searchRepo.searchShelters).not.toHaveBeenCalled();
  });

  it('response body never contains credential markers', async () => {
    const repo = makeSearchRepo({ shelters: [sampleShelter], total: 1 });
    const request = new Request('https://workers.pic4paws.pt/shelters');

    const response = await handleWorkerRequest(request, validEnv, {
      shelterSearchRepository: repo,
    });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
