import { describe, expect, it } from 'vitest';
import {
  handleWorkerRequest,
  type PetPublishRepository,
  type WorkerEnv,
  type WorkerPetDraftAuthenticator,
} from '../../apps/workers/src/index';
import type {
  AuthenticatedActor,
  PetDraftRecord,
  PetMediaAssetRecord,
} from '@pic4paws/domain';

const validEnv: WorkerEnv = {
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
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const shelterMember: AuthenticatedActor = {
  id: 'member-user',
  authUserId: 'auth-member',
  role: 'shelter_member',
  status: 'active',
  memberships: [
    {
      id: 'membership-1',
      userId: 'member-user',
      shelterId: 'shelter-a',
      role: 'shelter_member',
      deletedAt: null,
    },
  ],
};

const adopter: AuthenticatedActor = {
  id: 'adopter-user',
  authUserId: 'auth-adopter',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const publishablePet: PetDraftRecord = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  status: 'draft',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo, sociavel e pronto para uma familia.',
  mediaIds: ['media-1'],
  heroMediaId: 'media-1',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
  },
  publishedAt: null,
};

const publicImage: PetMediaAssetRecord = {
  id: 'media-1',
  shelterId: 'shelter-a',
  ownerUserId: 'member-user',
  visibility: 'public',
  mediaKind: 'image',
  r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
  deletedAt: null,
};

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

const authenticatorFor = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator => {
  return async ({ bearerToken }) => {
    expect(bearerToken).toBe('test-token');

    return actor;
  };
};

const createPublishRepository = (
  context: Awaited<ReturnType<PetPublishRepository['loadPublishContext']>>,
) => {
  const publishedPets: Array<{
    petId: string;
    pet: PetDraftRecord & { status: 'published'; publishedAt: string };
    actorId: string;
  }> = [];

  const repository: PetPublishRepository = {
    loadPublishContext: async (petId) => {
      expect(petId).toBe('pet-1');

      return context;
    },
    publishDraft: async (petId, pet, actor) => {
      publishedPets.push({ petId, pet, actorId: actor.id });

      return { petId, publishedAt: pet.publishedAt };
    },
  };

  return { repository, publishedPets };
};

describe('worker pet publish request contract', () => {
  it('publishes persisted drafts through authenticated injectable persistence', async () => {
    const { repository, publishedPets } = createPublishRepository({
      pet: publishablePet,
      mediaAssets: [publicImage],
      shelterVerificationStatus: 'verified',
    });

    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({}),
      }),
      validEnv,
      {
        now: () => '2026-06-04T15:00:00.000Z',
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petPublishRepository: repository,
      },
    );

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({
      status: 'pet_published',
      petId: 'pet-1',
      publishedAt: '2026-06-04T15:00:00.000Z',
    });
    expect(publishedPets).toEqual([
      {
        petId: 'pet-1',
        actorId: 'member-user',
        pet: {
          ...publishablePet,
          status: 'published',
          publishedAt: '2026-06-04T15:00:00.000Z',
        },
      },
    ]);
  });

  it('returns safe explicit responses when auth or publish adapters are not configured', async () => {
    const withoutAuth = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({}),
      }),
      validEnv,
      { now: () => '2026-06-04T15:00:00.000Z' },
    );

    expect(withoutAuth.status).toBe(501);
    await expect(json(withoutAuth)).resolves.toEqual({ status: 'auth_adapter_not_configured' });

    const withoutRepository = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({}),
      }),
      validEnv,
      {
        now: () => '2026-06-04T15:00:00.000Z',
        petDraftAuthenticator: authenticatorFor(shelterMember),
      },
    );

    expect(withoutRepository.status).toBe(501);
    await expect(json(withoutRepository)).resolves.toEqual({
      status: 'pet_publish_repository_not_configured',
    });
  });

  it('rejects unauthenticated, missing and invalid publish attempts safely', async () => {
    const { repository } = createPublishRepository({
      pet: publishablePet,
      mediaAssets: [publicImage],
      shelterVerificationStatus: 'verified',
    });

    const missingToken = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petPublishRepository: repository,
      },
    );

    expect(missingToken.status).toBe(401);
    await expect(json(missingToken)).resolves.toEqual({ status: 'unauthenticated' });

    const missingContext = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({}),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petPublishRepository: createPublishRepository(null).repository,
      },
    );

    expect(missingContext.status).toBe(404);
    await expect(json(missingContext)).resolves.toEqual({ status: 'pet_draft_not_found' });

    const unauthorized = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({}),
      }),
      validEnv,
      {
        now: () => '2026-06-04T15:00:00.000Z',
        petDraftAuthenticator: authenticatorFor(adopter),
        petPublishRepository: repository,
      },
    );

    expect(unauthorized.status).toBe(400);
    await expect(json(unauthorized)).resolves.toEqual({
      status: 'pet_publish_rejected',
      reasons: ['actor_not_authorized'],
    });

    const invalidMedia = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({}),
      }),
      validEnv,
      {
        now: () => '2026-06-04T15:00:00.000Z',
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petPublishRepository: createPublishRepository({
          pet: publishablePet,
          mediaAssets: [{ ...publicImage, visibility: 'private' }],
          shelterVerificationStatus: 'verified',
        }).repository,
      },
    );

    expect(invalidMedia.status).toBe(400);
    const body = await json(invalidMedia);

    expect(body).toEqual({
      status: 'pet_publish_rejected',
      reasons: ['missing_mediaIds'],
    });
    expect(JSON.stringify(body)).not.toContain('service-role-secret');
    expect(JSON.stringify(body)).not.toContain('r2-secret-key');
    expect(JSON.stringify(body)).not.toContain('test-token');
  });

  it('requires POST on publish routes', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/publish', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({}),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petPublishRepository: createPublishRepository(null).repository,
      },
    );

    expect(response.status).toBe(405);
    await expect(json(response)).resolves.toEqual({
      status: 'method_not_allowed',
      allowedMethods: ['POST'],
    });
  });
});
