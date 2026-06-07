import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type { PetProfileRepository, PublishedPetProfile } from '../../apps/workers/src/index';
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

const sampleProfile: PublishedPetProfile = {
  id: 'pet-pub-1',
  shelterId: 'shelter-a',
  name: 'Bobi',
  species: 'dog',
  locationLabel: 'Porto',
  shortDescription: 'Amigável e brincalhão.',
  heroMediaId: 'media-1',
  mediaIds: ['media-1', 'media-2'],
  publishedAt: '2026-06-01T10:00:00.000Z',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
    publicNotes: null,
  },
};

const makeProfileRepo = (result: PublishedPetProfile | null): PetProfileRepository => ({
  loadPublishedPet: vi.fn().mockResolvedValue(result),
});

describe('GET /pets/:petId — pet profile', () => {
  it('returns 200 with full profile when repository returns a published pet', async () => {
    const repo = makeProfileRepo(sampleProfile);
    const request = new Request('https://workers.pic4paws.pt/pets/pet-pub-1');

    const response = await handleWorkerRequest(request, validEnv, { petProfileRepository: repo });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', pet: sampleProfile });
  });

  it('returns 404 when repository returns null', async () => {
    const repo = makeProfileRepo(null);
    const request = new Request('https://workers.pic4paws.pt/pets/unknown-pet');

    const response = await handleWorkerRequest(request, validEnv, { petProfileRepository: repo });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ status: 'pet_not_found' });
  });

  it('passes the petId from the URL path to the repository', async () => {
    const repo = makeProfileRepo(sampleProfile);
    const request = new Request('https://workers.pic4paws.pt/pets/pet-pub-1');

    await handleWorkerRequest(request, validEnv, { petProfileRepository: repo });

    expect(repo.loadPublishedPet).toHaveBeenCalledWith({ petId: 'pet-pub-1' });
  });

  it('returns 405 for POST /pets/:petId', async () => {
    const repo = makeProfileRepo(sampleProfile);
    const request = new Request('https://workers.pic4paws.pt/pets/pet-pub-1', { method: 'POST' });

    const response = await handleWorkerRequest(request, validEnv, { petProfileRepository: repo });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
    expect(body.allowedMethods).toEqual(['GET']);
  });

  it('returns 501 when petProfileRepository is not injected', async () => {
    const request = new Request('https://workers.pic4paws.pt/pets/pet-pub-1');

    const response = await handleWorkerRequest(request, validEnv, {});
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('pet_profile_repository_not_configured');
  });

  it('includes the medical field in the profile response', async () => {
    const repo = makeProfileRepo(sampleProfile);
    const request = new Request('https://workers.pic4paws.pt/pets/pet-pub-1');

    const response = await handleWorkerRequest(request, validEnv, { petProfileRepository: repo });
    const body = (await response.json()) as { status: string; pet: PublishedPetProfile };

    expect(body.pet.medical).toEqual(sampleProfile.medical);
  });

  it('response body never contains draft status or credential markers', async () => {
    const repo = makeProfileRepo(sampleProfile);
    const request = new Request('https://workers.pic4paws.pt/pets/pet-pub-1');

    const response = await handleWorkerRequest(request, validEnv, { petProfileRepository: repo });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('"draft"');
    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });

  it('does not route /pets to the profile handler — /pets remains the feed route', async () => {
    // GET /pets (exact) must still hit the feed handler (501 without feed repo)
    // not the profile handler (which would be 501 with a different status message)
    const request = new Request('https://workers.pic4paws.pt/pets');

    const response = await handleWorkerRequest(request, validEnv, {});
    const body = await response.json();

    expect(body.status).toBe('pet_feed_repository_not_configured');
  });
});
