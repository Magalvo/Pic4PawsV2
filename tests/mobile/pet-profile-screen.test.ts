import { describe, it, expect } from 'vitest';
import { createMobilePetProfileUi } from '../../apps/mobile/src/pet-profile';
import type { PetProfileClient, PetProfileClientResult } from '@pic4paws/client';

const makeClient = (
  result: PetProfileClientResult,
): Pick<PetProfileClient, 'loadProfile'> => ({
  loadProfile: async () => result,
});

const samplePet = {
  id: 'pet-001',
  shelterId: 'shelter-001',
  name: 'Bolinha' as string | null,
  species: 'dog' as const,
  locationLabel: 'Lisboa' as string | null,
  shortDescription: null as string | null,
  heroMediaId: null as string | null,
  mediaIds: [] as string[],
  publishedAt: '2026-06-14T00:00:00.000Z',
  medical: {},
};

describe('pet profile screen — boundary contract', () => {
  it('produces not_found state when client returns pet_not_found', async () => {
    const client = makeClient({
      ok: false,
      status: 'pet_not_found',
      reasons: [],
    });
    const ui = createMobilePetProfileUi({ profileClient: client });
    const result = await ui.loadProfile('pet-missing');
    expect(result.state).toBe('not_found');
  });

  it('produces loaded state with pet on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      pet: { ...samplePet },
    });
    const ui = createMobilePetProfileUi({ profileClient: client });
    const result = await ui.loadProfile('pet-001');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.pet.id).toBe('pet-001');
      expect(result.pet.name).toBe('Bolinha');
    }
  });

  it('passes petId to the client', async () => {
    const seen: string[] = [];
    const trackingClient: Pick<PetProfileClient, 'loadProfile'> = {
      loadProfile: async (petId) => {
        seen.push(petId);
        return { ok: false, status: 'pet_not_found', reasons: [] };
      },
    };
    const ui = createMobilePetProfileUi({ profileClient: trackingClient });
    await ui.loadProfile('pet-target-abc');
    expect(seen).toEqual(['pet-target-abc']);
  });
});
