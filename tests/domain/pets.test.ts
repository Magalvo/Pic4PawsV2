import { describe, expect, it } from 'vitest';
import { sponsorshipProgress, validatePetPublishDraft } from '@pic4paws/domain';

describe('sponsorshipProgress', () => {
  it('calculates rounded sponsorship progress', () => {
    expect(sponsorshipProgress({ currentAmount: 210, targetAmount: 300, label: 'Care' })).toBe(70);
  });

  it('clamps invalid and overfunded sponsorship progress', () => {
    expect(sponsorshipProgress({ currentAmount: 500, targetAmount: 300, label: 'Care' })).toBe(100);
    expect(sponsorshipProgress({ currentAmount: 20, targetAmount: 0, label: 'Care' })).toBe(0);
  });
});

describe('validatePetPublishDraft', () => {
  it('rejects a pet draft missing required publishing fields', () => {
    const result = validatePetPublishDraft({
      name: 'Buddy',
      species: 'dog',
      tags: ['GoodWithCats'],
    });

    expect(result.valid).toBe(false);
    expect(result.missingFields).toEqual(['age', 'breed', 'description', 'imageUrl']);
  });

  it('accepts a complete pet draft', () => {
    const result = validatePetPublishDraft({
      name: 'Buddy',
      species: 'dog',
      age: '2 years old',
      breed: 'Golden Retriever',
      description: 'Friendly and energetic.',
      imageUrl: '/images/buddy.jpeg',
    });

    expect(result.valid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });
});
