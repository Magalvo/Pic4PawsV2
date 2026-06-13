import { describe, expect, it } from 'vitest';
import {
  createSupabasePetRepositories,
  SupabasePetRepositoryError,
  type SupabaseClientLike,
  type SupabaseQueryResult,
  type SupabaseTableQueryLike,
} from '../../apps/workers/src/index';
import type {
  MediaAssetInsertContract,
  PetDraftInsertContract,
  PetDraftUpdateContract,
} from '../../packages/database/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';

type Operation = {
  table: string;
  action: 'select' | 'insert' | 'update';
  payload?: unknown;
  columns?: string;
  filters: Array<{ kind: 'eq' | 'in' | 'is'; column: string; value: unknown }>;
  result: 'single' | 'maybeSingle' | 'many';
};

type FakeResponseMap = Record<string, SupabaseQueryResult<unknown>>;

class FakeSupabaseQuery implements SupabaseTableQueryLike {
  private action: Operation['action'] | null = null;
  private payload: unknown;
  private columns: string | undefined;
  private filters: Operation['filters'] = [];

  constructor(
    private readonly table: string,
    private readonly operations: Operation[],
    private readonly responses: FakeResponseMap,
  ) {}

  select(columns = '*'): SupabaseTableQueryLike {
    this.action ??= 'select';
    this.columns = columns;

    return this;
  }

  insert(payload: unknown): SupabaseTableQueryLike {
    this.action = 'insert';
    this.payload = payload;

    return this;
  }

  update(payload: unknown): SupabaseTableQueryLike {
    this.action = 'update';
    this.payload = payload;

    return this;
  }

  upsert(payload: unknown): SupabaseTableQueryLike {
    this.action = 'update';
    this.payload = payload;

    return this;
  }

  neq(): SupabaseTableQueryLike {
    return this;
  }

  eq(column: string, value: unknown): SupabaseTableQueryLike {
    this.filters.push({ kind: 'eq', column, value });

    return this;
  }

  in(column: string, value: unknown[]): SupabaseTableQueryLike {
    this.filters.push({ kind: 'in', column, value });

    return this;
  }

  is(column: string, value: unknown): SupabaseTableQueryLike {
    this.filters.push({ kind: 'is', column, value });

    return this;
  }

  order(): SupabaseTableQueryLike {
    return this;
  }

  range(): SupabaseTableQueryLike {
    return this;
  }

  async single(): Promise<SupabaseQueryResult<unknown>> {
    return this.resolve('single');
  }

  async maybeSingle(): Promise<SupabaseQueryResult<unknown>> {
    return this.resolve('maybeSingle');
  }

  async then<TResult1 = SupabaseQueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseQueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.resolve('many').then(onfulfilled, onrejected);
  }

  private async resolve(result: Operation['result']): Promise<SupabaseQueryResult<unknown>> {
    const operation: Operation = {
      table: this.table,
      action: this.action ?? 'select',
      payload: this.payload,
      columns: this.columns,
      filters: this.filters,
      result,
    };
    this.operations.push(operation);

    return this.responses[`${this.table}:${result}`] ?? { data: null, error: null };
  }
}

const createFakeSupabaseClient = (responses: FakeResponseMap = {}) => {
  const operations: Operation[] = [];
  const client: SupabaseClientLike = {
    from: (table) => new FakeSupabaseQuery(table, operations, responses),
    rpc: async () => ({ data: null, error: null }),
  };

  return { client, operations };
};

const actor: AuthenticatedActor = {
  id: 'member-user',
  authUserId: 'auth-member',
  role: 'shelter_member',
  status: 'active',
  memberships: [],
};

const insertContract: PetDraftInsertContract = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  status: 'draft',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo e sociavel.',
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
  createdAt: '2026-06-04T16:00:00.000Z',
  updatedAt: '2026-06-04T16:00:00.000Z',
  deletedAt: null,
};

const updateContract: PetDraftUpdateContract = {
  status: 'draft',
  name: 'Becas atualizado',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo e sociavel.',
  mediaIds: ['media-1'],
  heroMediaId: 'media-1',
  medical: insertContract.medical,
  sponsorship: insertContract.sponsorship,
  publishedAt: null,
  updatedAt: '2026-06-04T16:05:00.000Z',
};

const mediaAssetInsertContract: MediaAssetInsertContract = {
  id: 'media-1',
  ownerUserId: 'member-user',
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
  createdAt: '2026-06-04T16:00:00.000Z',
  updatedAt: '2026-06-04T16:00:00.000Z',
  deletedAt: null,
};

const petRow = {
  id: 'pet-1',
  shelter_id: 'shelter-a',
  status: 'draft',
  name: 'Becas',
  species: 'dog',
  location_label: 'Lisboa',
  short_description: 'Calmo e sociavel.',
  media_ids: ['media-1'],
  hero_media_id: 'media-1',
  medical: insertContract.medical,
  published_at: null,
};

const mediaRow = {
  id: 'media-1',
  shelter_id: 'shelter-a',
  owner_user_id: 'member-user',
  visibility: 'public',
  r2_object_key: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
  derivative_metadata: {
    mediaKind: 'image',
  },
  deleted_at: null,
};

describe('Supabase pet repository adapters', () => {
  it('persists media asset rows without signed upload URLs', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'media_assets:single': { data: { id: 'media-1' }, error: null },
    });
    const { mediaAssetRepository } = createSupabasePetRepositories({ client });

    await expect(
      mediaAssetRepository.saveMediaAsset(mediaAssetInsertContract, actor),
    ).resolves.toEqual({
      mediaAssetId: 'media-1',
    });

    expect(operations).toEqual([
      {
        table: 'media_assets',
        action: 'insert',
        payload: {
          id: 'media-1',
          owner_user_id: 'member-user',
          shelter_id: 'shelter-a',
          r2_object_key: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
          mime_type: 'image/jpeg',
          visibility: 'public',
          width: null,
          height: null,
          derivative_metadata: {
            byteSize: 1_200_000,
            bucketName: 'pic4paws-public',
            mediaKind: 'image',
            uploadStatus: 'signed',
            signedUrlPersisted: false,
          },
          created_at: '2026-06-04T16:00:00.000Z',
          updated_at: '2026-06-04T16:00:00.000Z',
          deleted_at: null,
        },
        columns: 'id',
        filters: [],
        result: 'single',
      },
    ]);
    expect(JSON.stringify(operations)).not.toContain('https://uploads.test');
  });

  it('creates and updates pet draft rows through an injected Supabase-like client', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'pets:single': { data: { id: 'pet-1' }, error: null },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    await expect(petDraftRepository.createDraft(insertContract, actor)).resolves.toEqual({
      petId: 'pet-1',
    });
    await expect(petDraftRepository.updateDraft('pet-1', updateContract, actor)).resolves.toEqual({
      petId: 'pet-1',
    });

    expect(operations).toEqual([
      {
        table: 'pets',
        action: 'insert',
        payload: {
          id: 'pet-1',
          shelter_id: 'shelter-a',
          status: 'draft',
          name: 'Becas',
          species: 'dog',
          location_label: 'Lisboa',
          short_description: 'Calmo e sociavel.',
          media_ids: ['media-1'],
          hero_media_id: 'media-1',
          medical: insertContract.medical,
          sponsorship: insertContract.sponsorship,
          published_at: null,
          created_at: '2026-06-04T16:00:00.000Z',
          updated_at: '2026-06-04T16:00:00.000Z',
          deleted_at: null,
        },
        columns: 'id',
        filters: [],
        result: 'single',
      },
      {
        table: 'pets',
        action: 'update',
        payload: {
          status: 'draft',
          name: 'Becas atualizado',
          species: 'dog',
          location_label: 'Lisboa',
          short_description: 'Calmo e sociavel.',
          media_ids: ['media-1'],
          hero_media_id: 'media-1',
          medical: insertContract.medical,
          sponsorship: insertContract.sponsorship,
          published_at: null,
          updated_at: '2026-06-04T16:05:00.000Z',
        },
        columns: 'id',
        filters: [{ kind: 'eq', column: 'id', value: 'pet-1' }],
        result: 'single',
      },
    ]);
  });

  it('loads media assets scoped by shelter and maps Supabase rows to domain records', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'media_assets:many': { data: [mediaRow], error: null },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    await expect(petDraftRepository.loadMediaAssets(['media-1'], 'shelter-a')).resolves.toEqual([
      {
        id: 'media-1',
        shelterId: 'shelter-a',
        ownerUserId: 'member-user',
        visibility: 'public',
        mediaKind: 'image',
        r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        deletedAt: null,
      },
    ]);
    expect(operations).toEqual([
      {
        table: 'media_assets',
        action: 'select',
        columns:
          'id,shelter_id,owner_user_id,visibility,r2_object_key,derivative_metadata,deleted_at',
        filters: [
          { kind: 'in', column: 'id', value: ['media-1'] },
          { kind: 'eq', column: 'shelter_id', value: 'shelter-a' },
        ],
        result: 'many',
      },
    ]);
  });

  it('loads publish context from persisted pet, media and shelter state', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: petRow, error: null },
      'media_assets:many': { data: [mediaRow], error: null },
      'shelters:maybeSingle': { data: { verification_status: 'verified' }, error: null },
    });
    const { petPublishRepository } = createSupabasePetRepositories({ client });

    await expect(petPublishRepository.loadPublishContext('pet-1')).resolves.toEqual({
      pet: {
        id: 'pet-1',
        shelterId: 'shelter-a',
        status: 'draft',
        name: 'Becas',
        species: 'dog',
        locationLabel: 'Lisboa',
        shortDescription: 'Calmo e sociavel.',
        mediaIds: ['media-1'],
        heroMediaId: 'media-1',
        medical: insertContract.medical,
        publishedAt: null,
      },
      mediaAssets: [
        {
          id: 'media-1',
          shelterId: 'shelter-a',
          ownerUserId: 'member-user',
          visibility: 'public',
          mediaKind: 'image',
          r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
          deletedAt: null,
        },
      ],
      shelterVerificationStatus: 'verified',
    });
    expect(operations.map((operation) => operation.table)).toEqual([
      'pets',
      'media_assets',
      'shelters',
    ]);
  });

  it('loads pet media attach context and persists attached media fields only', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: { ...petRow, media_ids: [], hero_media_id: null }, error: null },
      'media_assets:maybeSingle': { data: mediaRow, error: null },
      'pets:single': {
        data: {
          id: 'pet-1',
          media_ids: ['media-1'],
          hero_media_id: 'media-1',
        },
        error: null,
      },
    });
    const { petMediaAttachRepository } = createSupabasePetRepositories({ client });

    await expect(
      petMediaAttachRepository.loadAttachContext('pet-1', 'media-1'),
    ).resolves.toEqual({
      pet: {
        id: 'pet-1',
        shelterId: 'shelter-a',
        status: 'draft',
        name: 'Becas',
        species: 'dog',
        locationLabel: 'Lisboa',
        shortDescription: 'Calmo e sociavel.',
        mediaIds: [],
        heroMediaId: null,
        medical: insertContract.medical,
        publishedAt: null,
      },
      mediaAsset: {
        id: 'media-1',
        shelterId: 'shelter-a',
        ownerUserId: 'member-user',
        visibility: 'public',
        mediaKind: 'image',
        r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        deletedAt: null,
      },
    });
    await expect(
      petMediaAttachRepository.attachMediaToDraft(
        'pet-1',
        {
          ...insertContract,
          mediaIds: ['media-1'],
          heroMediaId: 'media-1',
        },
        actor,
        '2026-06-04T16:20:00.000Z',
      ),
    ).resolves.toEqual({
      petId: 'pet-1',
      mediaIds: ['media-1'],
      heroMediaId: 'media-1',
    });

    expect(operations).toEqual([
      {
        table: 'pets',
        action: 'select',
        columns:
          'id,shelter_id,status,name,species,location_label,short_description,media_ids,hero_media_id,medical,published_at',
        filters: [{ kind: 'eq', column: 'id', value: 'pet-1' }],
        result: 'maybeSingle',
      },
      {
        table: 'media_assets',
        action: 'select',
        columns:
          'id,shelter_id,owner_user_id,visibility,r2_object_key,derivative_metadata,deleted_at',
        filters: [{ kind: 'eq', column: 'id', value: 'media-1' }],
        result: 'maybeSingle',
      },
      {
        table: 'pets',
        action: 'update',
        payload: {
          media_ids: ['media-1'],
          hero_media_id: 'media-1',
          updated_at: '2026-06-04T16:20:00.000Z',
        },
        columns: 'id,media_ids,hero_media_id',
        filters: [
          { kind: 'eq', column: 'id', value: 'pet-1' },
          { kind: 'eq', column: 'status', value: 'draft' },
        ],
        result: 'single',
      },
    ]);
    expect(JSON.stringify(operations)).not.toContain('signedUrl');
    expect(JSON.stringify(operations)).not.toContain('service-role-secret');
    expect(JSON.stringify(operations)).not.toContain('r2-secret-key');
  });

  it('persists published pet state without trusting client supplied values', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'pets:single': {
        data: { id: 'pet-1', published_at: '2026-06-04T16:15:00.000Z' },
        error: null,
      },
    });
    const { petPublishRepository } = createSupabasePetRepositories({ client });

    await expect(
      petPublishRepository.publishDraft(
        'pet-1',
        {
          ...insertContract,
          status: 'published',
          publishedAt: '2026-06-04T16:15:00.000Z',
        },
        actor,
      ),
    ).resolves.toEqual({
      petId: 'pet-1',
      publishedAt: '2026-06-04T16:15:00.000Z',
    });

    expect(operations).toEqual([
      {
        table: 'pets',
        action: 'update',
        payload: {
          status: 'published',
          published_at: '2026-06-04T16:15:00.000Z',
          updated_at: '2026-06-04T16:15:00.000Z',
        },
        columns: 'id,published_at',
        filters: [
          { kind: 'eq', column: 'id', value: 'pet-1' },
          { kind: 'eq', column: 'status', value: 'draft' },
        ],
        result: 'single',
      },
    ]);
  });

  it('loads a published pet profile by ID and returns null when pet is absent', async () => {
    const publishedPetRow = {
      ...petRow,
      status: 'published',
      published_at: '2026-06-04T16:15:00.000Z',
    };
    const { client, operations } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: publishedPetRow, error: null },
    });
    const { petProfileRepository } = createSupabasePetRepositories({ client });

    await expect(petProfileRepository.loadPublishedPet({ petId: 'pet-1' })).resolves.toEqual({
      id: 'pet-1',
      shelterId: 'shelter-a',
      name: 'Becas',
      species: 'dog',
      locationLabel: 'Lisboa',
      shortDescription: 'Calmo e sociavel.',
      heroMediaId: 'media-1',
      mediaIds: ['media-1'],
      publishedAt: '2026-06-04T16:15:00.000Z',
      medical: insertContract.medical,
    });

    expect(operations).toEqual([
      {
        table: 'pets',
        action: 'select',
        columns:
          'id,shelter_id,name,species,location_label,short_description,hero_media_id,media_ids,published_at,medical',
        filters: [
          { kind: 'eq', column: 'id', value: 'pet-1' },
          { kind: 'eq', column: 'status', value: 'published' },
          { kind: 'is', column: 'deleted_at', value: null },
        ],
        result: 'maybeSingle',
      },
    ]);

    // Returns null when pet is absent
    const { client: client2 } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: null, error: null },
    });
    const { petProfileRepository: repo2 } = createSupabasePetRepositories({ client: client2 });

    await expect(repo2.loadPublishedPet({ petId: 'unknown-pet' })).resolves.toBeNull();
  });

  it('throws sanitized adapter errors without leaking secrets', async () => {
    const { client } = createFakeSupabaseClient({
      'pets:single': {
        data: null,
        error: { message: 'service-role-secret r2-secret-key Bearer test-token' },
      },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    await expect(petDraftRepository.createDraft(insertContract, actor)).rejects.toEqual(
      new SupabasePetRepositoryError('Failed to create pet draft'),
    );
    await expect(petDraftRepository.createDraft(insertContract, actor)).rejects.not.toThrow(
      /service-role-secret|r2-secret-key|test-token/,
    );
  });
});
