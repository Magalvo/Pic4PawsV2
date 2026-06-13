import { describe, expect, it, vi } from 'vitest';
import { createSupabasePetRepositories } from '../../apps/workers/src/pet-supabase';

const makeFeedRow = (id = 'pet-1') => ({
  id,
  shelter_id: 'shelter-a',
  name: 'Becas',
  species: 'dog',
  location_label: 'Porto',
  short_description: 'Amigável.',
  hero_media_id: 'media-1',
  media_ids: ['media-1'],
  published_at: '2026-06-01T10:00:00.000Z',
});


describe('petFeedRepository.loadPublishedPets — shelter join-filter', () => {
  it('includes shelters!inner(deleted_at) in the select to filter out pets of deleted shelters', async () => {
    const feedRow = makeFeedRow();
    const selectCalls: string[] = [];

    const chain: Record<string, unknown> = {};
    chain['select'] = vi.fn().mockImplementation((cols: string) => {
      selectCalls.push(cols);
      return chain;
    });
    chain['eq'] = vi.fn().mockReturnValue(chain);
    chain['is'] = vi.fn().mockReturnValue(chain);
    chain['order'] = vi.fn().mockReturnValue(chain);
    chain['range'] = vi.fn().mockResolvedValue({ data: [feedRow], error: null, count: 1 });
    chain['then'] = vi.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [feedRow], error: null, count: 1 }).then(resolve),
    );
    const client = { from: vi.fn().mockReturnValue(chain), rpc: vi.fn() };

    const { petFeedRepository } = createSupabasePetRepositories({ client });
    await petFeedRepository.loadPublishedPets({ limit: 10, offset: 0 });

    const joinFilter = selectCalls.some((s) => s.includes('shelters!inner'));
    expect(joinFilter).toBe(true);
  });

  it('filters shelters.deleted_at is null on both count and data queries', async () => {
    const feedRow = makeFeedRow();
    const isFilters: Array<[string, unknown]> = [];

    const chain: Record<string, unknown> = {};
    chain['select'] = vi.fn().mockReturnValue(chain);
    chain['eq'] = vi.fn().mockReturnValue(chain);
    chain['is'] = vi.fn().mockImplementation((col: string, val: unknown) => {
      isFilters.push([col, val]);
      return chain;
    });
    chain['order'] = vi.fn().mockReturnValue(chain);
    chain['range'] = vi.fn().mockResolvedValue({ data: [feedRow], error: null, count: 1 });
    chain['then'] = vi.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [feedRow], error: null, count: 1 }).then(resolve),
    );
    const client = { from: vi.fn().mockReturnValue(chain), rpc: vi.fn() };

    const { petFeedRepository } = createSupabasePetRepositories({ client });
    await petFeedRepository.loadPublishedPets({ limit: 10, offset: 0 });

    const shelterDeletedAtFilters = isFilters.filter(([col]) => col === 'shelters.deleted_at');
    expect(shelterDeletedAtFilters.length).toBeGreaterThanOrEqual(2);
    shelterDeletedAtFilters.forEach(([, val]) => expect(val).toBeNull());
  });
});
