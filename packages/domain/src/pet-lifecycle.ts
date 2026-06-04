import { canManageShelter, type AuthenticatedActor } from './auth';

export type PetLifecycleStatus =
  | 'draft'
  | 'published'
  | 'adoption_pending'
  | 'adopted'
  | 'not_available'
  | 'archived';

export type PetLifecycleSpecies =
  | 'dog'
  | 'cat'
  | 'horse'
  | 'donkey'
  | 'guinea_pig'
  | 'rabbit'
  | 'bird'
  | 'other';

export type PublicPetMedicalStatus = {
  vaccinated?: boolean | null;
  sterilized?: boolean | null;
  microchipped?: boolean | null;
  specialNeeds?: boolean | null;
  publicNotes?: string | null;
};

export type PetDraftRecord = {
  id: string;
  shelterId: string;
  status: PetLifecycleStatus;
  name?: string | null;
  species?: PetLifecycleSpecies | null;
  locationLabel?: string | null;
  shortDescription?: string | null;
  mediaIds: string[];
  heroMediaId?: string | null;
  medical: PublicPetMedicalStatus;
  publishedAt?: string | null;
};

export type PetMediaAssetRecord = {
  id: string;
  shelterId: string | null;
  ownerUserId: string | null;
  visibility: 'public' | 'private';
  mediaKind: 'image' | 'document';
  r2ObjectKey: string;
  deletedAt?: string | null;
};

export type PetPublishingRequiredField =
  | 'name'
  | 'species'
  | 'locationLabel'
  | 'shortDescription'
  | 'mediaIds';

export type PetDraftPublishingValidation = {
  valid: boolean;
  missingFields: PetPublishingRequiredField[];
};

export type PetPublishBlockReason =
  | 'actor_not_authorized'
  | 'shelter_not_verified'
  | 'pet_not_draft'
  | `missing_${PetPublishingRequiredField}`;

export type AttachPetMediaBlockReason =
  | 'pet_not_draft'
  | 'media_deleted'
  | 'media_shelter_mismatch'
  | 'media_not_public_image'
  | 'media_already_attached';

export type AttachMediaAssetToPetDraftInput = {
  pet: PetDraftRecord;
  mediaAsset: PetMediaAssetRecord;
};

export type AttachMediaAssetToPetDraftResult =
  | { ok: true; pet: PetDraftRecord }
  | { ok: false; reasons: AttachPetMediaBlockReason[] };

export type PublishPetDraftInput = {
  actor: AuthenticatedActor | null;
  pet: PetDraftRecord;
  mediaAssets?: PetMediaAssetRecord[];
  shelterVerificationStatus: 'draft' | 'pending_review' | 'verified' | 'rejected' | 'suspended';
  now: string;
};

export type PublishPetDraftResult =
  | { ok: true; pet: PetDraftRecord & { status: 'published'; publishedAt: string } }
  | { ok: false; reasons: PetPublishBlockReason[] };

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const isPublicPetImageForShelter = (
  pet: PetDraftRecord,
  mediaAsset: PetMediaAssetRecord,
): boolean =>
  mediaAsset.deletedAt == null &&
  mediaAsset.shelterId === pet.shelterId &&
  mediaAsset.visibility === 'public' &&
  mediaAsset.mediaKind === 'image';

const hasPublishableMedia = (
  pet: PetDraftRecord,
  mediaAssets?: PetMediaAssetRecord[],
): boolean => {
  if (mediaAssets === undefined) {
    return pet.mediaIds.length > 0;
  }

  return mediaAssets.some(
    (mediaAsset) =>
      pet.mediaIds.includes(mediaAsset.id) && isPublicPetImageForShelter(pet, mediaAsset),
  );
};

export const attachMediaAssetToPetDraft = ({
  pet,
  mediaAsset,
}: AttachMediaAssetToPetDraftInput): AttachMediaAssetToPetDraftResult => {
  const reasons: AttachPetMediaBlockReason[] = [];

  if (pet.status !== 'draft') {
    reasons.push('pet_not_draft');
  }

  if (mediaAsset.deletedAt != null) {
    reasons.push('media_deleted');
  }

  if (mediaAsset.shelterId !== pet.shelterId) {
    reasons.push('media_shelter_mismatch');
  }

  if (mediaAsset.visibility !== 'public' || mediaAsset.mediaKind !== 'image') {
    reasons.push('media_not_public_image');
  }

  if (pet.mediaIds.includes(mediaAsset.id)) {
    reasons.push('media_already_attached');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    pet: {
      ...pet,
      mediaIds: [...pet.mediaIds, mediaAsset.id],
      heroMediaId: pet.heroMediaId ?? mediaAsset.id,
    },
  };
};

export const validatePetDraftForPublishing = (
  pet: PetDraftRecord,
  mediaAssets?: PetMediaAssetRecord[],
): PetDraftPublishingValidation => {
  const missingFields: PetPublishingRequiredField[] = [];

  if (!hasText(pet.name)) {
    missingFields.push('name');
  }

  if (!pet.species) {
    missingFields.push('species');
  }

  if (!hasText(pet.locationLabel)) {
    missingFields.push('locationLabel');
  }

  if (!hasText(pet.shortDescription)) {
    missingFields.push('shortDescription');
  }

  if (!hasPublishableMedia(pet, mediaAssets)) {
    missingFields.push('mediaIds');
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

export const publishPetDraft = ({
  actor,
  pet,
  mediaAssets,
  shelterVerificationStatus,
  now,
}: PublishPetDraftInput): PublishPetDraftResult => {
  const reasons: PetPublishBlockReason[] = [];

  if (pet.status !== 'draft') {
    reasons.push('pet_not_draft');
  }

  if (shelterVerificationStatus !== 'verified') {
    reasons.push('shelter_not_verified');
  }

  if (!canManageShelter(actor, pet.shelterId)) {
    reasons.push('actor_not_authorized');
  }

  for (const field of validatePetDraftForPublishing(pet, mediaAssets).missingFields) {
    reasons.push(`missing_${field}`);
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    pet: {
      ...pet,
      status: 'published',
      publishedAt: now,
    },
  };
};
