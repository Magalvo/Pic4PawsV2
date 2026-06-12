import { describe, expect, it, vi } from 'vitest';
import { createSupabaseShelterPetListRepositories } from '../../apps/workers/src/shelter-pet-list-supabase';

const makeQueryChain = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  const methods = ['insert', 'update', 'in'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain['select'] = vi.fn().mockReturnValue(chain);
  chain['eq'] = vi.fn().mockReturnValue(chain);
  chain['is'] = vi.fn().mockReturnValue(chain);
  chain['order'] = vi.fn().mockReturnValue(chain);
  chain['range'] = vi.fn().mockResolvedValue(result);
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  return chain;
};

const makeClient = (chain: ReturnType<typeof makeQueryChain>) => ({
  from: vi.fn().mockReturnValue(chain),
});

describe('createSupabaseShelterPetListRepositories', () => {
  describe('listPets', () => {
    it('returns mapped pets and total for the given shelterId', async () => {
      const chain = makeQueryChain({
        data: [
          {
            id: 'pet-1',
            name: 'Becas',
            species: 'dog',
            status: 'draft',
            hero_media_id: null,
            location_label: 'Lisboa',
            created_at: '2026-06-01T10:00:00.000Z',
            updated_at: '2026-06-10T12:00:00.000Z',
          },
        ],
        error: null,
        count: 1,
      });
      const client = makeClient(chain);
      const { shelterPetListRepository } = createSupabaseShelterPetListRepositories({ client });

      const result = await shelterPetListRepository.listPets({
        shelterId: 'shelter-a',
        limit: 20,
        offset: 0,
      });

      expect(result.total).toBe(1);
      expect(result.pets).toHaveLength(1);
      expect(result.pets[0]).toEqual({
        petId: 'pet-1',
        name: 'Becas',
        species: 'dog',
        status: 'draft',
        heroMediaId: null,
        locationLabel: 'Lisboa',
        createdAt: '2026-06-01T10:00:00.000Z',
        updatedAt: '2026-06-10T12:00:00.000Z',
      });
      expect(client.from).toHaveBeenCalledWith('pets');
      expect(chain.eq).toHaveBeenCalledWith('shelter_id', 'shelter-a');
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('returns empty list and zero total when shelter has no pets', async () => {
      const chain = makeQueryChain({ data: [], error: null, count: 0 });
      const client = makeClient(chain);
      const { shelterPetListRepository } = createSupabaseShelterPetListRepositories({ client });

      const result = await shelterPetListRepository.listPets({ shelterId: 'shelter-b' });

      expect(result.total).toBe(0);
      expect(result.pets).toEqual([]);
    });

    it('applies limit and offset via range and orders by updated_at descending', async () => {
      const chain = makeQueryChain({ data: [], error: null, count: 50 });
      const client = makeClient(chain);
      const { shelterPetListRepository } = createSupabaseShelterPetListRepositories({ client });

      await shelterPetListRepository.listPets({
        shelterId: 'shelter-a',
        limit: 10,
        offset: 20,
      });

      expect(chain.range).toHaveBeenCalledWith(20, 29);
      expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('throws SupabaseShelterPetListRepositoryError on Supabase error', async () => {
      const chain = makeQueryChain({
        data: null,
        error: { message: 'connection refused' },
        count: null,
      });
      const client = makeClient(chain);
      const { shelterPetListRepository } = createSupabaseShelterPetListRepositories({ client });

      await expect(
        shelterPetListRepository.listPets({ shelterId: 'shelter-a' }),
      ).rejects.toThrow('Failed to list shelter pets');
    });

    it('maps all status values correctly', async () => {
      const rows = [
        { id: 'p1', name: 'A', species: 'dog', status: 'draft', hero_media_id: null, location_label: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
        { id: 'p2', name: 'B', species: 'cat', status: 'published', hero_media_id: 'media-1', location_label: 'Porto', created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
        { id: 'p3', name: null, species: null, status: 'archived', hero_media_id: null, location_label: null, created_at: '2026-01-03T00:00:00Z', updated_at: '2026-01-03T00:00:00Z' },
      ];
      const chain = makeQueryChain({ data: rows, error: null, count: 3 });
      const client = makeClient(chain);
      const { shelterPetListRepository } = createSupabaseShelterPetListRepositories({ client });

      const result = await shelterPetListRepository.listPets({ shelterId: 'shelter-a' });

      expect(result.pets[0]?.status).toBe('draft');
      expect(result.pets[1]?.status).toBe('published');
      expect(result.pets[1]?.heroMediaId).toBe('media-1');
      expect(result.pets[2]?.status).toBe('archived');
      expect(result.pets[2]?.name).toBeNull();
    });
  });
});
