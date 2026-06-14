import { describe, expect, it } from 'vitest';
import * as Domain from '@pic4paws/domain';
import type {
  AdoptionApplicationStatus,
  DonationStatus,
  Locale,
  PetSpecies,
  PetStatus,
  ShelterVerificationStatus,
} from '@pic4paws/domain';

describe('@pic4paws/domain public canonical contract', () => {
  it('does not export prototype fixtures or lookup helpers from the package entrypoint', () => {
    const forbiddenRuntimeExports = [
      'pets',
      'shelters',
      'feedPosts',
      'findPetById',
      'findShelterById',
      'AdoptionStatus',
      'PetProfile',
      'NewPetDraft',
    ];

    for (const exportName of forbiddenRuntimeExports) {
      expect(Domain).not.toHaveProperty(exportName);
    }

    expect(JSON.stringify(Domain)).not.toContain('Austin');
    expect(JSON.stringify(Domain)).not.toContain('Seattle');
  });

  it('exposes PT-first canonical value lists aligned with the SDD', () => {
    expect(Domain.SUPPORTED_LOCALES).toEqual(['pt-PT', 'en']);
    expect(Domain.DEFAULT_LOCALE).toBe('pt-PT');
    expect(Domain.PET_SPECIES).toEqual([
      'dog',
      'cat',
      'horse',
      'donkey',
      'guinea_pig',
      'rabbit',
      'bird',
      'other',
    ]);
    expect(Domain.PET_STATUSES).toEqual([
      'draft',
      'published',
      'adoption_pending',
      'adopted',
      'not_available',
      'archived',
    ]);
    expect(Domain.SHELTER_VERIFICATION_STATUSES).toEqual([
      'draft',
      'pending_review',
      'verified',
      'rejected',
      'suspended',
    ]);
    expect(Domain.DONATION_STATUSES).toEqual([
      'created',
      'pending_payment',
      'paid',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded',
    ]);
  });

  it('keeps public type names usable from the package entrypoint', () => {
    const locale: Locale = 'pt-PT';
    const species: PetSpecies = 'guinea_pig';
    const petStatus: PetStatus = 'adoption_pending';
    const shelterStatus: ShelterVerificationStatus = 'verified';
    const adoptionStatus: AdoptionApplicationStatus = 'under_review';
    const donationStatus: DonationStatus = 'paid';

    expect({ locale, species, petStatus, shelterStatus, adoptionStatus, donationStatus }).toEqual({
      locale: 'pt-PT',
      species: 'guinea_pig',
      petStatus: 'adoption_pending',
      shelterStatus: 'verified',
      adoptionStatus: 'under_review',
      donationStatus: 'paid',
    });
  });
});
