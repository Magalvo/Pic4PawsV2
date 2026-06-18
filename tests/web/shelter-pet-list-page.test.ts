import { describe, it, expect } from 'vitest';
import { createWebShelterPetListUi } from '../../apps/web/src/shelter-pet-list';
import type { ShelterPetListClient, ShelterPetListClientResult } from '@pic4paws/client';

const makeClient = (
  result: ShelterPetListClientResult,
): Pick<ShelterPetListClient, 'loadShelterPets'> => ({
  loadShelterPets: async () => result,
});

const pet = {
  petId: 'pet-001',
  name: 'Rex',
  species: 'dog',
  status: 'published' as const,
  heroMediaId: null,
  locationLabel: 'Lisboa',
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
};

describe('web shelter pet list page — boundary contract', () => {
  it('produces loaded state when pets exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', pets: [pet], total: 1 });
    const ui = createWebShelterPetListUi({ shelterPetListClient: client });
    const result = await ui.loadShelterPets('shelter-001');
    expect(result.state).toBe('loaded');
  });

  it('produces empty state when no pets', async () => {
    const client = makeClient({ ok: true, status: 'ok', pets: [], total: 0 });
    const ui = createWebShelterPetListUi({ shelterPetListClient: client });
    const result = await ui.loadShelterPets('shelter-001');
    expect(result.state).toBe('empty');
  });

  it('produces forbidden state', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createWebShelterPetListUi({ shelterPetListClient: client });
    const result = await ui.loadShelterPets('shelter-001');
    expect(result.state).toBe('forbidden');
  });
});
