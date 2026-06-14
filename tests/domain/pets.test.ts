import { describe, expect, it } from 'vitest';
import { calculateSponsorshipProgress, validatePetDraftForPublishing } from '@pic4paws/domain';

describe('calculateSponsorshipProgress', () => {
  it('calculates rounded sponsorship progress', () => {
    expect(
      calculateSponsorshipProgress({
        currentMonthCoveredCents: 21_000,
        monthlyGoalCents: 30_000,
      }),
    ).toBe(70);
  });

  it('clamps invalid and overfunded sponsorship progress', () => {
    expect(
      calculateSponsorshipProgress({
        currentMonthCoveredCents: 50_000,
        monthlyGoalCents: 30_000,
      }),
    ).toBe(100);
    expect(
      calculateSponsorshipProgress({
        currentMonthCoveredCents: 2_000,
        monthlyGoalCents: 0,
      }),
    ).toBe(0);
  });
});

describe('validatePetDraftForPublishing', () => {
  it('rejects a pet draft missing required publishing fields', () => {
    const result = validatePetDraftForPublishing({
      id: 'pet-1',
      shelterId: 'shelter-1',
      status: 'draft',
      name: 'Buddy',
      species: 'dog',
      mediaIds: [],
      medical: {},
    });

    expect(result.valid).toBe(false);
    expect(result.missingFields).toEqual(['locationLabel', 'shortDescription', 'mediaIds']);
  });

  it('accepts a complete pet draft', () => {
    const result = validatePetDraftForPublishing({
      id: 'pet-1',
      shelterId: 'shelter-1',
      status: 'draft',
      name: 'Buddy',
      species: 'dog',
      locationLabel: 'Lisboa',
      shortDescription: 'Friendly and energetic.',
      mediaIds: ['media-1'],
      medical: {},
    });

    expect(result.valid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });
});
