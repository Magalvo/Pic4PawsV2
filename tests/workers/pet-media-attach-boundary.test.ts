import { describe, expect, it } from 'vitest';
import {
  handleWorkerRequest,
  type PetMediaAttachRepository,
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

const draftWithoutMedia: PetDraftRecord = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  status: 'draft',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo, sociavel e pronto para uma familia.',
  mediaIds: [],
  heroMediaId: null,
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

const createAttachRepository = (
  context: Awaited<ReturnType<PetMediaAttachRepository['loadAttachContext']>>,
) => {
  const attachedDrafts: Array<{
    petId: string;
    pet: PetDraftRecord;
    actorId: string;
  }> = [];

  const repository: PetMediaAttachRepository = {
    loadAttachContext: async (petId, mediaId) => {
      expect(petId).toBe('pet-1');
      expect(mediaId).toBe('media-1');

      return context;
    },
    attachMediaToDraft: async (petId, pet, actor) => {
      attachedDrafts.push({ petId, pet, actorId: actor.id });

      return {
        petId,
        mediaIds: pet.mediaIds,
        heroMediaId: pet.heroMediaId ?? null,
      };
    },
  };

  return { repository, attachedDrafts };
};

describe('worker pet media attach request contract', () => {
  it('attaches persisted public image media to an authenticated pet draft', async () => {
    const { repository, attachedDrafts } = createAttachRepository({
      pet: draftWithoutMedia,
      mediaAsset: publicImage,
    });

    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: 'media-1' }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petMediaAttachRepository: repository,
      },
    );

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({
      status: 'pet_media_attached',
      petId: 'pet-1',
      mediaId: 'media-1',
      mediaIds: ['media-1'],
      heroMediaId: 'media-1',
    });
    expect(attachedDrafts).toEqual([
      {
        petId: 'pet-1',
        actorId: 'member-user',
        pet: {
          ...draftWithoutMedia,
          mediaIds: ['media-1'],
          heroMediaId: 'media-1',
        },
      },
    ]);
  });

  it('returns explicit safe responses when auth or attach repository are not configured', async () => {
    const withoutAuth = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: 'media-1' }),
      }),
      validEnv,
    );

    expect(withoutAuth.status).toBe(501);
    await expect(json(withoutAuth)).resolves.toEqual({ status: 'auth_adapter_not_configured' });

    const withoutRepository = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: 'media-1' }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
      },
    );

    expect(withoutRepository.status).toBe(501);
    await expect(json(withoutRepository)).resolves.toEqual({
      status: 'pet_media_attach_repository_not_configured',
    });
  });

  it('rejects invalid, unauthorized and missing attach attempts safely', async () => {
    const { repository } = createAttachRepository({
      pet: draftWithoutMedia,
      mediaAsset: publicImage,
    });

    const invalidPayload = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: '' }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petMediaAttachRepository: repository,
      },
    );

    expect(invalidPayload.status).toBe(400);
    await expect(json(invalidPayload)).resolves.toEqual({
      status: 'invalid_pet_media_attach_request',
      reasons: ['invalid_media_id'],
    });

    const unauthorized = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: 'media-1' }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(adopter),
        petMediaAttachRepository: repository,
      },
    );

    expect(unauthorized.status).toBe(403);
    await expect(json(unauthorized)).resolves.toEqual({
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });

    const missingContext = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: 'media-1' }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petMediaAttachRepository: createAttachRepository(null).repository,
      },
    );

    expect(missingContext.status).toBe(404);
    await expect(json(missingContext)).resolves.toEqual({
      status: 'pet_media_attach_context_not_found',
    });
  });

  it('reuses domain media attach rejection rules without leaking credentials', async () => {
    const { repository } = createAttachRepository({
      pet: draftWithoutMedia,
      mediaAsset: {
        ...publicImage,
        visibility: 'private',
        r2ObjectKey: 'private/shelters/shelter-a/pet_public_image/media-1.jpg',
      },
    });

    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: 'media-1' }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petMediaAttachRepository: repository,
      },
    );

    expect(response.status).toBe(400);
    const body = await json(response);

    expect(body).toEqual({
      status: 'pet_media_attach_rejected',
      reasons: ['media_not_public_image'],
    });
    expect(JSON.stringify(body)).not.toContain('service-role-secret');
    expect(JSON.stringify(body)).not.toContain('r2-secret-key');
    expect(JSON.stringify(body)).not.toContain('test-token');
    expect(JSON.stringify(body)).not.toContain('signedUrl');
  });

  it('requires POST on media attach routes', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1/media', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ mediaId: 'media-1' }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petMediaAttachRepository: createAttachRepository(null).repository,
      },
    );

    expect(response.status).toBe(405);
    await expect(json(response)).resolves.toEqual({
      status: 'method_not_allowed',
      allowedMethods: ['POST'],
    });
  });
});
