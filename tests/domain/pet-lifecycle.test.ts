import { describe, expect, it } from 'vitest';
import {
  publishPetDraft,
  resolveAuthenticatedActor,
  validatePetDraftForPublishing,
  type AuthUserRecord,
  type PetDraftRecord,
  type ShelterMembershipRecord,
} from '@pic4paws/domain';

const users: AuthUserRecord[] = [
  {
    id: 'member-user',
    authUserId: 'auth-member',
    role: 'shelter_member',
    status: 'active',
  },
  {
    id: 'adopter-user',
    authUserId: 'auth-adopter',
    role: 'adopter',
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

const adopter = resolveAuthenticatedActor({
  authUserId: 'auth-adopter',
  users,
  memberships,
});

const publishableDraft: PetDraftRecord = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  status: 'draft',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo, sociavel e pronto para uma familia.',
  mediaIds: ['media-public-1'],
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
    publicNotes: 'Sem necessidades especiais conhecidas.',
  },
};

describe('validatePetDraftForPublishing', () => {
  it('requires SDD publishing fields and one public image', () => {
    expect(
      validatePetDraftForPublishing({
        ...publishableDraft,
        name: '',
        shortDescription: '',
        mediaIds: [],
      }),
    ).toEqual({
      valid: false,
      missingFields: ['name', 'shortDescription', 'mediaIds'],
    });
  });

  it('accepts a complete public-safe draft', () => {
    expect(validatePetDraftForPublishing(publishableDraft)).toEqual({
      valid: true,
      missingFields: [],
    });
  });
});

describe('publishPetDraft', () => {
  it('publishes a valid draft for an authorized shelter member of a verified shelter', () => {
    const result = publishPetDraft({
      actor: shelterMember,
      pet: publishableDraft,
      shelterVerificationStatus: 'verified',
      now: '2026-06-04T11:45:00.000Z',
    });

    expect(result).toEqual({
      ok: true,
      pet: {
        ...publishableDraft,
        status: 'published',
        publishedAt: '2026-06-04T11:45:00.000Z',
      },
    });
  });

  it('blocks unauthorized actors and unverified shelters', () => {
    expect(
      publishPetDraft({
        actor: adopter,
        pet: publishableDraft,
        shelterVerificationStatus: 'verified',
        now: '2026-06-04T11:45:00.000Z',
      }),
    ).toEqual({ ok: false, reasons: ['actor_not_authorized'] });

    expect(
      publishPetDraft({
        actor: shelterMember,
        pet: publishableDraft,
        shelterVerificationStatus: 'pending_review',
        now: '2026-06-04T11:45:00.000Z',
      }),
    ).toEqual({ ok: false, reasons: ['shelter_not_verified'] });
  });

  it('blocks incomplete drafts and non-draft records', () => {
    expect(
      publishPetDraft({
        actor: shelterMember,
        pet: { ...publishableDraft, mediaIds: [] },
        shelterVerificationStatus: 'verified',
        now: '2026-06-04T11:45:00.000Z',
      }),
    ).toEqual({ ok: false, reasons: ['missing_mediaIds'] });

    expect(
      publishPetDraft({
        actor: shelterMember,
        pet: { ...publishableDraft, status: 'published' },
        shelterVerificationStatus: 'verified',
        now: '2026-06-04T11:45:00.000Z',
      }),
    ).toEqual({ ok: false, reasons: ['pet_not_draft'] });
  });
});
