import { describe, expect, it, vi } from 'vitest';
import {
  createSupabaseShelterDeletionRepositories,
  SupabaseShelterDeletionRepositoryError,
} from '../../apps/workers/src/shelter-delete-supabase';

const makeClient = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  chain['update'] = vi.fn().mockReturnValue(chain);
  chain['eq'] = vi.fn().mockReturnValue(chain);
  chain['is'] = vi.fn().mockReturnValue(chain);
  chain['select'] = vi.fn().mockReturnValue(chain);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  return {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn(),
    _chain: chain,
  };
};

describe('createSupabaseShelterDeletionRepositories', () => {
  describe('deleteShelter', () => {
    it('returns shelterId on successful soft-delete', async () => {
      const client = makeClient({ data: { id: 'shelter-a' }, error: null });
      const { shelterDeletionRepository } = createSupabaseShelterDeletionRepositories({ client });

      const result = await shelterDeletionRepository.deleteShelter('shelter-a', 'user-1');

      expect(result).toEqual({ shelterId: 'shelter-a' });
      expect(client.from).toHaveBeenCalledWith('shelters');
    });

    it('sets deleted_at in the update payload', async () => {
      const client = makeClient({ data: { id: 'shelter-a' }, error: null });
      const { shelterDeletionRepository } = createSupabaseShelterDeletionRepositories({ client });

      await shelterDeletionRepository.deleteShelter('shelter-a', 'user-1');

      const updateArg = (client._chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
      expect(typeof updateArg.deleted_at).toBe('string');
      expect(updateArg.deleted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('filters by id and deleted_at is null (prevents double-delete)', async () => {
      const client = makeClient({ data: { id: 'shelter-a' }, error: null });
      const { shelterDeletionRepository } = createSupabaseShelterDeletionRepositories({ client });

      await shelterDeletionRepository.deleteShelter('shelter-a', 'user-1');

      expect(client._chain.eq).toHaveBeenCalledWith('id', 'shelter-a');
      expect(client._chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('returns null when no rows matched (shelter already deleted or not found)', async () => {
      const client = makeClient({ data: null, error: null });
      const { shelterDeletionRepository } = createSupabaseShelterDeletionRepositories({ client });

      const result = await shelterDeletionRepository.deleteShelter('missing', 'user-1');

      expect(result).toBeNull();
    });

    it('throws SupabaseShelterDeletionRepositoryError on Supabase errors', async () => {
      const client = makeClient({ data: null, error: { message: 'connection error' } });
      const { shelterDeletionRepository } = createSupabaseShelterDeletionRepositories({ client });

      await expect(
        shelterDeletionRepository.deleteShelter('shelter-a', 'user-1'),
      ).rejects.toBeInstanceOf(SupabaseShelterDeletionRepositoryError);
    });
  });
});
