import type {
  PetDraftRecord,
  PetLifecycleSpecies,
  PetLifecycleStatus,
  PetMediaAssetRecord,
  PublicPetMedicalStatus,
} from '@pic4paws/domain';

export type PetDraftSponsorshipMetadata = {
  enabled: boolean;
  monthlyGoalCents: number | null;
  publicNotes: string | null;
};

export type PetDraftInsertContract = {
  id: string;
  shelterId: string;
  status: Extract<PetLifecycleStatus, 'draft'>;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  mediaIds: string[];
  heroMediaId: string | null;
  medical: PublicPetMedicalStatus;
  sponsorship: PetDraftSponsorshipMetadata;
  publishedAt: null;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
};

export type PetDraftUpdateContract = Omit<
  PetDraftInsertContract,
  'id' | 'shelterId' | 'createdAt' | 'deletedAt'
>;

export type PetDraftPersistenceRejectionReason =
  | 'pet_not_draft'
  | 'duplicate_media_ids'
  | 'hero_media_not_attached'
  | 'media_asset_missing'
  | 'media_deleted'
  | 'media_shelter_mismatch'
  | 'media_not_public_image';

export type CreatePetDraftInsertContractInput = {
  pet: PetDraftRecord;
  mediaAssets?: PetMediaAssetRecord[];
  now: string;
};

export type CreatePetDraftUpdateContractInput = {
  pet: PetDraftRecord;
  mediaAssets?: PetMediaAssetRecord[];
  now: string;
};

export type CreatePetDraftInsertContractResult =
  | { ok: true; insert: PetDraftInsertContract }
  | { ok: false; reasons: PetDraftPersistenceRejectionReason[] };

export type CreatePetDraftUpdateContractResult =
  | { ok: true; update: PetDraftUpdateContract }
  | { ok: false; reasons: PetDraftPersistenceRejectionReason[] };

const defaultSponsorship: PetDraftSponsorshipMetadata = {
  enabled: false,
  monthlyGoalCents: null,
  publicNotes: null,
};

const hasDuplicateMediaIds = (mediaIds: string[]): boolean =>
  new Set(mediaIds).size !== mediaIds.length;

const uniqueReasons = (
  reasons: PetDraftPersistenceRejectionReason[],
): PetDraftPersistenceRejectionReason[] => [...new Set(reasons)];

const validatePetDraftPersistence = (
  pet: PetDraftRecord,
  mediaAssets: PetMediaAssetRecord[] = [],
): PetDraftPersistenceRejectionReason[] => {
  const reasons: PetDraftPersistenceRejectionReason[] = [];

  if (pet.status !== 'draft') {
    reasons.push('pet_not_draft');
  }

  if (hasDuplicateMediaIds(pet.mediaIds)) {
    reasons.push('duplicate_media_ids');
  }

  if (pet.heroMediaId != null && !pet.mediaIds.includes(pet.heroMediaId)) {
    reasons.push('hero_media_not_attached');
  }

  for (const mediaId of new Set(pet.mediaIds)) {
    const mediaAsset = mediaAssets.find((candidate) => candidate.id === mediaId);

    if (!mediaAsset) {
      reasons.push('media_asset_missing');
      continue;
    }

    if (mediaAsset.deletedAt != null) {
      reasons.push('media_deleted');
      continue;
    }

    if (mediaAsset.shelterId !== pet.shelterId) {
      reasons.push('media_shelter_mismatch');
      continue;
    }

    if (mediaAsset.visibility !== 'public' || mediaAsset.mediaKind !== 'image') {
      reasons.push('media_not_public_image');
    }
  }

  return uniqueReasons(reasons);
};

const toDraftUpdateContract = (
  pet: PetDraftRecord,
  now: string,
): PetDraftUpdateContract => ({
  status: 'draft',
  name: pet.name ?? null,
  species: pet.species ?? null,
  locationLabel: pet.locationLabel ?? null,
  shortDescription: pet.shortDescription ?? null,
  mediaIds: [...pet.mediaIds],
  heroMediaId: pet.heroMediaId ?? null,
  medical: pet.medical,
  sponsorship: defaultSponsorship,
  publishedAt: null,
  updatedAt: now,
});

export const createPetDraftInsertContract = ({
  pet,
  mediaAssets,
  now,
}: CreatePetDraftInsertContractInput): CreatePetDraftInsertContractResult => {
  const reasons = validatePetDraftPersistence(pet, mediaAssets);

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    insert: {
      id: pet.id,
      shelterId: pet.shelterId,
      ...toDraftUpdateContract(pet, now),
      createdAt: now,
      deletedAt: null,
    },
  };
};

export const createPetDraftUpdateContract = ({
  pet,
  mediaAssets,
  now,
}: CreatePetDraftUpdateContractInput): CreatePetDraftUpdateContractResult => {
  const reasons = validatePetDraftPersistence(pet, mediaAssets);

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    update: toDraftUpdateContract(pet, now),
  };
};
