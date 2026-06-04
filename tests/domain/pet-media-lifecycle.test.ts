import { describe, expect, it } from 'vitest';
import {
  attachMediaAssetToPetDraft,
  publishPetDraft,
  resolveAuthenticatedActor,
  validatePetDraftForPublishing,
  type AuthUserRecord,
  type PetDraftRecord,
  type PetMediaAssetRecord,
  type ShelterMembershipRecord,
} from '@pic4paws/domain';

const users: AuthUserRecord[] = [
  {
    id: 'member-user',
    authUserId: 'auth-member',
    role: 'shelter_member',
    status: 'active',
  },
];

const memberships: ShelterMembershipRecord[] = [
  {
    id: 'membership-1',
    userId: 'member-user',
    shelterId: 'shelter-a',
    role: 'shelter_member',
    deletedAt: null,
  },
];

const shelterMember = resolveAuthenticatedActor({
  authUserId: 'auth-member',
  users,
  memberships,
});

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
};

const publicPetImage: PetMediaAssetRecord = {
  id: 'media-public-1',
  shelterId: 'shelter-a',
  ownerUserId: 'member-user',
  visibility: 'public',
  mediaKind: 'image',
  r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-public-1.jpg',
  deletedAt: null,
};

describe('attachMediaAssetToPetDraft', () => {
  it('attaches same-shelter public image media and sets first image as hero', () => {
    expect(
      attachMediaAssetToPetDraft({
        pet: draftWithoutMedia,
        mediaAsset: publicPetImage,
      }),
    ).toEqual({
      ok: true,
      pet: {
        ...draftWithoutMedia,
        mediaIds: ['media-public-1'],
        heroMediaId: 'media-public-1',
      },
    });
  });

  it('rejects private, deleted and cross-shelter media assets', () => {
    expect(
      attachMediaAssetToPetDraft({
        pet: draftWithoutMedia,
        mediaAsset: {
          ...publicPetImage,
          id: 'private-doc',
          visibility: 'private',
          mediaKind: 'document',
        },
      }),
    ).toEqual({
      ok: false,
      reasons: ['media_not_public_image'],
    });

    expect(
      attachMediaAssetToPetDraft({
        pet: draftWithoutMedia,
        mediaAsset: { ...publicPetImage, deletedAt: '2026-06-04T12:00:00.000Z' },
      }),
    ).toEqual({
      ok: false,
      reasons: ['media_deleted'],
    });

    expect(
      attachMediaAssetToPetDraft({
        pet: draftWithoutMedia,
        mediaAsset: { ...publicPetImage, shelterId: 'shelter-b' },
      }),
    ).toEqual({
      ok: false,
      reasons: ['media_shelter_mismatch'],
    });
  });

  it('does not attach media twice', () => {
    expect(
      attachMediaAssetToPetDraft({
        pet: {
          ...draftWithoutMedia,
          mediaIds: ['media-public-1'],
          heroMediaId: 'media-public-1',
        },
        mediaAsset: publicPetImage,
      }),
    ).toEqual({
      ok: false,
      reasons: ['media_already_attached'],
    });
  });
});

describe('pet publishing with persisted media', () => {
  it('validates attached media IDs against persisted public image assets', () => {
    expect(
      validatePetDraftForPublishing(
        {
          ...draftWithoutMedia,
          mediaIds: ['media-public-1'],
          heroMediaId: 'media-public-1',
        },
        [publicPetImage],
      ),
    ).toEqual({
      valid: true,
      missingFields: [],
    });
  });

  it('does not allow private or mismatched media to satisfy publish requirements', () => {
    const pet = {
      ...draftWithoutMedia,
      mediaIds: ['private-doc'],
      heroMediaId: 'private-doc',
    };

    expect(
      validatePetDraftForPublishing(pet, [
        {
          ...publicPetImage,
          id: 'private-doc',
          visibility: 'private',
          mediaKind: 'document',
        },
      ]),
    ).toEqual({
      valid: false,
      missingFields: ['mediaIds'],
    });

    expect(
      publishPetDraft({
        actor: shelterMember,
        pet,
        mediaAssets: [
          {
            ...publicPetImage,
            id: 'private-doc',
            visibility: 'private',
            mediaKind: 'document',
          },
        ],
        shelterVerificationStatus: 'verified',
        now: '2026-06-04T11:45:00.000Z',
      }),
    ).toEqual({ ok: false, reasons: ['missing_mediaIds'] });
  });
});
