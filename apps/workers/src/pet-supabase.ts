import type { MediaAssetRepository } from './media-upload';
import type { PetDraftRepository, PetPublishRepository } from './pet-drafts';
import type {
  PetDraftRecord,
  PetLifecycleSpecies,
  PetLifecycleStatus,
  PetMediaAssetRecord,
} from '@pic4paws/domain';
import type {
  PetDraftInsertContract,
  MediaAssetInsertContract,
  PetDraftSponsorshipMetadata,
  PetDraftUpdateContract,
} from '@pic4paws/database';

type SupabaseErrorLike = {
  message?: string;
};

export type SupabaseQueryResult<TData> = {
  data: TData | null;
  error: SupabaseErrorLike | null;
};

export type SupabaseTableQueryLike = PromiseLike<SupabaseQueryResult<unknown>> & {
  select: (columns?: string) => SupabaseTableQueryLike;
  insert: (payload: unknown) => SupabaseTableQueryLike;
  update: (payload: unknown) => SupabaseTableQueryLike;
  eq: (column: string, value: unknown) => SupabaseTableQueryLike;
  in: (column: string, value: unknown[]) => SupabaseTableQueryLike;
  single: () => Promise<SupabaseQueryResult<unknown>>;
  maybeSingle: () => Promise<SupabaseQueryResult<unknown>>;
};

export type SupabaseClientLike = {
  from: (table: string) => SupabaseTableQueryLike;
};

export class SupabasePetRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabasePetRepositoryError';
  }
}

export type CreateSupabasePetRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabasePetRepositoriesResult = {
  mediaAssetRepository: MediaAssetRepository;
  petDraftRepository: PetDraftRepository;
  petPublishRepository: PetPublishRepository;
};

type PetRow = {
  id: string;
  shelter_id: string;
  status: PetLifecycleStatus;
  name: string | null;
  species: PetLifecycleSpecies | null;
  location_label: string | null;
  short_description: string | null;
  media_ids: string[];
  hero_media_id: string | null;
  medical: PetDraftRecord['medical'];
  sponsorship?: PetDraftSponsorshipMetadata;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type MediaAssetRow = {
  id: string;
  shelter_id: string | null;
  owner_user_id: string | null;
  visibility: 'public' | 'private';
  r2_object_key: string;
  derivative_metadata?: {
    mediaKind?: 'image' | 'document' | 'unknown';
    media_kind?: 'image' | 'document' | 'unknown';
  } | null;
  deleted_at?: string | null;
};

type ShelterRow = {
  verification_status:
    | 'draft'
    | 'pending_review'
    | 'verified'
    | 'rejected'
    | 'suspended';
};

const mediaColumns =
  'id,shelter_id,owner_user_id,visibility,r2_object_key,derivative_metadata,deleted_at';

const petColumns =
  'id,shelter_id,status,name,species,location_label,short_description,media_ids,hero_media_id,medical,published_at';

const toPetInsertRow = (insert: PetDraftInsertContract): PetRow => ({
  id: insert.id,
  shelter_id: insert.shelterId,
  status: insert.status,
  name: insert.name,
  species: insert.species,
  location_label: insert.locationLabel,
  short_description: insert.shortDescription,
  media_ids: insert.mediaIds,
  hero_media_id: insert.heroMediaId,
  medical: insert.medical,
  sponsorship: insert.sponsorship,
  published_at: insert.publishedAt,
  created_at: insert.createdAt,
  updated_at: insert.updatedAt,
  deleted_at: insert.deletedAt,
});

const toMediaAssetInsertRow = (insert: MediaAssetInsertContract) => ({
  id: insert.id,
  owner_user_id: insert.ownerUserId,
  shelter_id: insert.shelterId,
  r2_object_key: insert.r2ObjectKey,
  mime_type: insert.mimeType,
  visibility: insert.visibility,
  width: insert.width,
  height: insert.height,
  derivative_metadata: insert.derivativeMetadata,
  created_at: insert.createdAt,
  updated_at: insert.updatedAt,
  deleted_at: insert.deletedAt,
});

const toPetUpdateRow = (update: PetDraftUpdateContract): Partial<PetRow> => ({
  status: update.status,
  name: update.name,
  species: update.species,
  location_label: update.locationLabel,
  short_description: update.shortDescription,
  media_ids: update.mediaIds,
  hero_media_id: update.heroMediaId,
  medical: update.medical,
  sponsorship: update.sponsorship,
  published_at: update.publishedAt,
  updated_at: update.updatedAt,
});

const toPublishedPetUpdateRow = (pet: PetDraftRecord & { status: 'published'; publishedAt: string }) => ({
  status: pet.status,
  published_at: pet.publishedAt,
  updated_at: pet.publishedAt,
});

const assertSupabaseResult = <TData>(
  result: SupabaseQueryResult<unknown>,
  failureMessage: string,
): TData => {
  if (result.error) {
    throw new SupabasePetRepositoryError(failureMessage);
  }

  return result.data as TData;
};

const toMediaKind = (row: MediaAssetRow): PetMediaAssetRecord['mediaKind'] => {
  const metadataKind = row.derivative_metadata?.mediaKind ?? row.derivative_metadata?.media_kind;

  return metadataKind === 'document' ? 'document' : 'image';
};

const toMediaAssetRecord = (row: MediaAssetRow): PetMediaAssetRecord => ({
  id: row.id,
  shelterId: row.shelter_id,
  ownerUserId: row.owner_user_id,
  visibility: row.visibility,
  mediaKind: toMediaKind(row),
  r2ObjectKey: row.r2_object_key,
  deletedAt: row.deleted_at ?? null,
});

const toPetDraftRecord = (row: PetRow): PetDraftRecord => ({
  id: row.id,
  shelterId: row.shelter_id,
  status: row.status,
  name: row.name,
  species: row.species,
  locationLabel: row.location_label,
  shortDescription: row.short_description,
  mediaIds: row.media_ids,
  heroMediaId: row.hero_media_id,
  medical: row.medical,
  publishedAt: row.published_at,
});

export const createSupabasePetRepositories = ({
  client,
}: CreateSupabasePetRepositoriesInput): CreateSupabasePetRepositoriesResult => {
  const mediaAssetRepository: MediaAssetRepository = {
    saveMediaAsset: async (insert, actor) => {
      void actor;

      const result = await client
        .from('media_assets')
        .insert(toMediaAssetInsertRow(insert))
        .select('id')
        .single();
      const row = assertSupabaseResult<{ id: string }>(
        result,
        'Failed to save media asset',
      );

      return { mediaAssetId: row.id };
    },
  };

  const loadMediaAssets: PetDraftRepository['loadMediaAssets'] = async (mediaIds, shelterId) => {
    if (mediaIds.length === 0) {
      return [];
    }

    const result = await client
      .from('media_assets')
      .select(mediaColumns)
      .in('id', mediaIds)
      .eq('shelter_id', shelterId);
    const rows = assertSupabaseResult<MediaAssetRow[]>(result, 'Failed to load media assets') ?? [];

    return rows.map(toMediaAssetRecord);
  };

  const petDraftRepository: PetDraftRepository = {
    loadMediaAssets,
    createDraft: async (insert, actor) => {
      void actor;

      const result = await client.from('pets').insert(toPetInsertRow(insert)).select('id').single();
      const row = assertSupabaseResult<{ id: string }>(result, 'Failed to create pet draft');

      return { petId: row.id };
    },
    updateDraft: async (petId, update, actor) => {
      void actor;

      const result = await client
        .from('pets')
        .update(toPetUpdateRow(update))
        .eq('id', petId)
        .select('id')
        .single();
      const row = assertSupabaseResult<{ id: string }>(result, 'Failed to update pet draft');

      return { petId: row.id };
    },
  };

  const petPublishRepository: PetPublishRepository = {
    loadPublishContext: async (petId) => {
      const petResult = await client.from('pets').select(petColumns).eq('id', petId).maybeSingle();
      const petRow = assertSupabaseResult<PetRow | null>(
        petResult,
        'Failed to load pet publish context',
      );

      if (!petRow) {
        return null;
      }

      const pet = toPetDraftRecord(petRow);
      const mediaAssets = await loadMediaAssets(pet.mediaIds, pet.shelterId);
      const shelterResult = await client
        .from('shelters')
        .select('verification_status')
        .eq('id', pet.shelterId)
        .maybeSingle();
      const shelterRow = assertSupabaseResult<ShelterRow | null>(
        shelterResult,
        'Failed to load shelter verification status',
      );

      if (!shelterRow) {
        return null;
      }

      return {
        pet,
        mediaAssets,
        shelterVerificationStatus: shelterRow.verification_status,
      };
    },
    publishDraft: async (petId, pet, actor) => {
      void actor;

      const result = await client
        .from('pets')
        .update(toPublishedPetUpdateRow(pet))
        .eq('id', petId)
        .eq('status', 'draft')
        .select('id,published_at')
        .single();
      const row = assertSupabaseResult<{ id: string; published_at: string }>(
        result,
        'Failed to publish pet draft',
      );

      return {
        petId: row.id,
        publishedAt: row.published_at,
      };
    },
  };

  return {
    mediaAssetRepository,
    petDraftRepository,
    petPublishRepository,
  };
};
