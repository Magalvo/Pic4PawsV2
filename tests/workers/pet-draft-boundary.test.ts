import { describe, expect, it } from 'vitest';
import { parseEnvironmentConfig, type EnvironmentRecord } from '../../packages/config/src/index';
import {
  handleWorkerRequest,
  type PetDraftRepository,
  type WorkerPetDraftAuthenticator,
} from '../../apps/workers/src/index';
import type { AuthenticatedActor, PetMediaAssetRecord } from '@pic4paws/domain';
import type {
  PetDraftInsertContract,
  PetDraftUpdateContract,
} from '../../packages/database/src/index';

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

const publicImage: PetMediaAssetRecord = {
  id: 'media-1',
  shelterId: 'shelter-a',
  ownerUserId: 'member-user',
  visibility: 'public',
  mediaKind: 'image',
  r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
  deletedAt: null,
};

const validDraftPayload = {
  petId: 'pet-1',
  shelterId: 'shelter-a',
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
};

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

const authenticatorFor = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator => {
  return async ({ bearerToken }) => {
    expect(bearerToken).toBe('test-token');

    return actor;
  };
};

const createRepository = () => {
  const createdDrafts: PetDraftInsertContract[] = [];
  const updatedDrafts: Array<{ petId: string; update: PetDraftUpdateContract }> = [];

  const repository: PetDraftRepository = {
    loadMediaAssets: async (mediaIds) => (mediaIds.includes('media-1') ? [publicImage] : []),
    createDraft: async (insert) => {
      createdDrafts.push(insert);

      return { petId: insert.id };
    },
    updateDraft: async (petId, update) => {
      updatedDrafts.push({ petId, update });

      return { petId };
    },
  };

  return { repository, createdDrafts, updatedDrafts };
};

describe('worker pet draft request contract', () => {
  it('parses the configured pet drafts path', () => {
    expect(parseEnvironmentConfig(validEnv)).toMatchObject({
      ok: true,
      config: {
        workers: {
          petDraftsPath: '/pets/drafts',
        },
      },
    });
  });

  it('returns safe explicit responses when auth or persistence adapters are not configured', async () => {
    const withoutAuth = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify(validDraftPayload),
      }),
      validEnv,
      { now: () => '2026-06-04T14:00:00.000Z' },
    );

    expect(withoutAuth.status).toBe(501);
    await expect(json(withoutAuth)).resolves.toEqual({ status: 'auth_adapter_not_configured' });

    const withoutPersistence = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify(validDraftPayload),
      }),
      validEnv,
      {
        now: () => '2026-06-04T14:00:00.000Z',
        petDraftAuthenticator: authenticatorFor(shelterMember),
      },
    );

    expect(withoutPersistence.status).toBe(501);
    await expect(json(withoutPersistence)).resolves.toEqual({
      status: 'pet_draft_repository_not_configured',
    });
  });

  it('creates pet drafts through authenticated injectable persistence', async () => {
    const { repository, createdDrafts } = createRepository();
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify(validDraftPayload),
      }),
      validEnv,
      {
        now: () => '2026-06-04T14:00:00.000Z',
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petDraftRepository: repository,
      },
    );

    expect(response.status).toBe(201);
    await expect(json(response)).resolves.toEqual({
      status: 'pet_draft_created',
      petId: 'pet-1',
    });
    expect(createdDrafts).toEqual([
      {
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
        sponsorship: {
          enabled: false,
          monthlyGoalCents: null,
          publicNotes: null,
        },
        publishedAt: null,
        createdAt: '2026-06-04T14:00:00.000Z',
        updatedAt: '2026-06-04T14:00:00.000Z',
        deletedAt: null,
      },
    ]);
  });

  it('updates pet drafts through authenticated injectable persistence', async () => {
    const { repository, updatedDrafts } = createRepository();
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts/pet-1', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ ...validDraftPayload, name: 'Becas atualizado' }),
      }),
      validEnv,
      {
        now: () => '2026-06-04T14:05:00.000Z',
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petDraftRepository: repository,
      },
    );

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({
      status: 'pet_draft_updated',
      petId: 'pet-1',
    });
    expect(updatedDrafts).toEqual([
      {
        petId: 'pet-1',
        update: {
          status: 'draft',
          name: 'Becas atualizado',
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
          sponsorship: {
            enabled: false,
            monthlyGoalCents: null,
            publicNotes: null,
          },
          publishedAt: null,
          updatedAt: '2026-06-04T14:05:00.000Z',
        },
      },
    ]);
  });

  it('rejects unauthenticated, unauthorized and invalid pet draft requests safely', async () => {
    const { repository } = createRepository();

    const missingToken = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        body: JSON.stringify(validDraftPayload),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petDraftRepository: repository,
      },
    );

    expect(missingToken.status).toBe(401);
    await expect(json(missingToken)).resolves.toEqual({ status: 'unauthenticated' });

    const unauthorized = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify(validDraftPayload),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(adopter),
        petDraftRepository: repository,
      },
    );

    expect(unauthorized.status).toBe(403);
    await expect(json(unauthorized)).resolves.toEqual({
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });

    const invalidMedia = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({
          ...validDraftPayload,
          mediaIds: ['missing-media'],
          heroMediaId: null,
        }),
      }),
      validEnv,
      {
        petDraftAuthenticator: authenticatorFor(shelterMember),
        petDraftRepository: repository,
      },
    );

    expect(invalidMedia.status).toBe(400);
    const body = await json(invalidMedia);

    expect(body).toEqual({
      status: 'invalid_pet_draft',
      reasons: ['media_asset_missing'],
    });
    expect(JSON.stringify(body)).not.toContain('service-role-secret');
    expect(JSON.stringify(body)).not.toContain('r2-secret-key');
    expect(JSON.stringify(body)).not.toContain('test-token');
  });
});
