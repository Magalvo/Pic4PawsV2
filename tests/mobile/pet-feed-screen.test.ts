import { describe, it, expect } from 'vitest';
import { createMobilePetFeedUi } from '../../apps/mobile/src/pet-feed';
import type { PetFeedClient, PetFeedClientResult } from '@pic4paws/client';

const makeClient = (
  result: PetFeedClientResult,
): Pick<PetFeedClient, 'loadFeed'> => ({
  loadFeed: async () => result,
});

const samplePet = {
  id: 'pet-001',
  shelterId: 'shelter-001',
  name: 'Bolinha' as string | null,
  species: 'dog' as const,
  locationLabel: 'Lisboa' as string | null,
  shortDescription: 'Um cão muito simpático' as string | null,
  heroMediaId: null as string | null,
  mediaIds: [] as string[],
  publishedAt: '2026-06-14T00:00:00.000Z',
};

describe('pet feed screen — boundary contract', () => {
  it('produces failed state when client returns an error', async () => {
    const client = makeClient({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
    const ui = createMobilePetFeedUi({ feedClient: client });
    const result = await ui.loadFeed({ query: {} });
    expect(result.state).toBe('failed');
  });

  it('produces loaded state with pets on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      pets: [{ ...samplePet }],
      total: 1,
    });
    const ui = createMobilePetFeedUi({ feedClient: client });
    const result = await ui.loadFeed({ query: {} });
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.pets).toHaveLength(1);
      expect(result.pets[0].id).toBe('pet-001');
    }
  });

  it('produces empty state when no pets returned', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      pets: [],
      total: 0,
    });
    const ui = createMobilePetFeedUi({ feedClient: client });
    const result = await ui.loadFeed({ query: {} });
    expect(result.state).toBe('empty');
  });
});
