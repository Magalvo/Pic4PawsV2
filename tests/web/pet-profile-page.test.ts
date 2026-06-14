import { describe, it, expect } from 'vitest';
import { createWebPetProfileUi } from '../../apps/web/src/pet-profile';
import type { PetProfileClientResult } from '@pic4paws/client';

const notFoundClient = {
  loadProfile: async (): Promise<PetProfileClientResult> => ({
    ok: false,
    status: 'pet_not_found',
    reasons: [],
  }),
};

const petStub = {
  id: 'pet-abc',
  shelterId: 'shelter-1',
  name: 'Bolinha',
  species: null,
  locationLabel: 'Lisboa',
  shortDescription: null,
  heroMediaId: null,
  mediaIds: [],
  publishedAt: '2026-01-01T00:00:00Z',
  medical: { sterilized: null, vaccinated: null, microchipped: null },
} as const;

describe('pet profile page — boundary contract', () => {
  it('produces not_found state for pet_not_found client response', async () => {
    const ui = createWebPetProfileUi({ profileClient: notFoundClient });
    const result = await ui.loadProfile('pet-missing');
    expect(result.state).toBe('not_found');
  });

  it('produces loaded state with the fetched pet', async () => {
    const loadedClient = {
      loadProfile: async (): Promise<PetProfileClientResult> => ({
        ok: true,
        status: 'ok',
        pet: { ...petStub },
      }),
    };
    const ui = createWebPetProfileUi({ profileClient: loadedClient });
    const result = await ui.loadProfile('pet-abc');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.pet.id).toBe('pet-abc');
      expect(result.pet.name).toBe('Bolinha');
    }
  });

  it('passes the exact petId to profileClient.loadProfile', async () => {
    const seen: string[] = [];
    const trackingClient = {
      loadProfile: async (petId: string): Promise<PetProfileClientResult> => {
        seen.push(petId);
        return { ok: false, status: 'pet_not_found', reasons: [] };
      },
    };
    const ui = createWebPetProfileUi({ profileClient: trackingClient });
    await ui.loadProfile('pet-xyz-789');
    expect(seen).toEqual(['pet-xyz-789']);
  });
});
