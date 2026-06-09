import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  ShelterProfileRepository,
  PublicShelterProfile,
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

const sampleShelter: PublicShelterProfile = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter',
  verificationStatus: 'verified',
  publicEmail: 'contacto@abrigodosamigos.pt',
  publicPhone: '+351912345678',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  description: 'Um abrigo com coração.',
  logoMediaId: 'logo-media-1',
  coverMediaId: 'cover-media-1',
};

const makeShelterRepo = (result: PublicShelterProfile | null): ShelterProfileRepository => ({
  loadShelterProfile: vi.fn().mockResolvedValue(result),
});

describe('GET /shelters/:shelterId — shelter profile', () => {
  it('returns 200 with full profile when repository returns a shelter', async () => {
    const repo = makeShelterRepo(sampleShelter);
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a');

    const response = await handleWorkerRequest(request, validEnv, {
      shelterProfileRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', shelter: sampleShelter });
  });

  it('returns 404 when repository returns null', async () => {
    const repo = makeShelterRepo(null);
    const request = new Request('https://workers.pic4paws.pt/shelters/unknown-shelter');

    const response = await handleWorkerRequest(request, validEnv, {
      shelterProfileRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ status: 'shelter_not_found' });
  });

  it('passes the shelterId from the URL path to the repository', async () => {
    const repo = makeShelterRepo(sampleShelter);
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a');

    await handleWorkerRequest(request, validEnv, { shelterProfileRepository: repo });

    expect(repo.loadShelterProfile).toHaveBeenCalledWith({ shelterId: 'shelter-a' });
  });

  it('returns 405 for POST /shelters/:shelterId', async () => {
    const repo = makeShelterRepo(sampleShelter);
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a', {
      method: 'POST',
    });

    const response = await handleWorkerRequest(request, validEnv, {
      shelterProfileRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
    expect(body.allowedMethods).toEqual(['GET']);
  });

  it('returns 501 when shelterProfileRepository is not injected', async () => {
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a');

    const response = await handleWorkerRequest(request, validEnv, {});
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('shelter_profile_repository_not_configured');
  });

  it('includes the verificationStatus field in the profile response', async () => {
    const repo = makeShelterRepo(sampleShelter);
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a');

    const response = await handleWorkerRequest(request, validEnv, {
      shelterProfileRepository: repo,
    });
    const body = (await response.json()) as { status: string; shelter: PublicShelterProfile };

    expect(body.shelter.verificationStatus).toBe('verified');
  });

  it('response body never contains credential markers', async () => {
    const repo = makeShelterRepo(sampleShelter);
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a');

    const response = await handleWorkerRequest(request, validEnv, {
      shelterProfileRepository: repo,
    });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });

  it('routes exact /shelters to the shelter search handler, not the profile handler', async () => {
    // matchWorkerShelterProfileId requires a segment after the base path.
    // Exact /shelters is handled by the shelter search route instead.
    const request = new Request('https://workers.pic4paws.pt/shelters');

    const response = await handleWorkerRequest(request, validEnv, {});
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('shelter_search_repository_not_configured');
  });
});
