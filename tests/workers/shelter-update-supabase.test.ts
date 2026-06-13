import { describe, expect, it, vi } from 'vitest';
import {
  createSupabaseShelterUpdateRepositories,
  SupabaseShelterUpdateRepositoryError,
} from '../../apps/workers/src/shelter-update-supabase';
import type { ShelterUpdateInput } from '../../apps/workers/src/shelter-update';

const makeClient = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  chain['update'] = vi.fn().mockReturnValue(chain);
  chain['eq'] = vi.fn().mockReturnValue(chain);
  chain['is'] = vi.fn().mockReturnValue(chain);
  chain['select'] = vi.fn().mockReturnValue(chain);
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  return {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn(),
    _chain: chain,
  };
};

const validInput: ShelterUpdateInput = { name: 'Canil Atualizado' };

describe('createSupabaseShelterUpdateRepositories', () => {
  describe('updateShelter', () => {
    it('returns shelterId on successful update', async () => {
      const client = makeClient({ data: { id: 'shelter-a' }, error: null });
      const { shelterUpdateRepository } = createSupabaseShelterUpdateRepositories({ client });

      const result = await shelterUpdateRepository.updateShelter('shelter-a', validInput, 'user-1');

      expect(result).toEqual({ shelterId: 'shelter-a' });
      expect(client.from).toHaveBeenCalledWith('shelters');
    });

    it('filters by deleted_at is null', async () => {
      const client = makeClient({ data: { id: 'shelter-a' }, error: null });
      const { shelterUpdateRepository } = createSupabaseShelterUpdateRepositories({ client });

      await shelterUpdateRepository.updateShelter('shelter-a', validInput, 'user-1');

      expect(client._chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('maps camelCase input fields to snake_case column names', async () => {
      const client = makeClient({ data: { id: 'shelter-a' }, error: null });
      const { shelterUpdateRepository } = createSupabaseShelterUpdateRepositories({ client });

      const input: ShelterUpdateInput = {
        name: 'Novo Nome',
        publicEmail: 'x@x.pt',
        publicPhone: '+351',
        description: 'Desc',
      };
      await shelterUpdateRepository.updateShelter('shelter-a', input, 'user-1');

      const updateArg = (client._chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
      expect(updateArg.name).toBe('Novo Nome');
      expect(updateArg.public_email).toBe('x@x.pt');
      expect(updateArg.public_phone).toBe('+351');
      expect(updateArg.description).toBe('Desc');
      expect('publicEmail' in updateArg).toBe(false);
    });

    it('only includes fields present in the input', async () => {
      const client = makeClient({ data: { id: 'shelter-a' }, error: null });
      const { shelterUpdateRepository } = createSupabaseShelterUpdateRepositories({ client });

      await shelterUpdateRepository.updateShelter('shelter-a', { name: 'X' }, 'user-1');

      const updateArg = (client._chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
      expect(Object.keys(updateArg)).toEqual(['name']);
    });

    it('returns null when no rows matched (data is null with no error)', async () => {
      const client = makeClient({ data: null, error: null });
      const { shelterUpdateRepository } = createSupabaseShelterUpdateRepositories({ client });

      const result = await shelterUpdateRepository.updateShelter('missing', validInput, 'user-1');

      expect(result).toBeNull();
    });

    it('throws SupabaseShelterUpdateRepositoryError on Supabase errors', async () => {
      const client = makeClient({ data: null, error: { message: 'duplicate key' } });
      const { shelterUpdateRepository } = createSupabaseShelterUpdateRepositories({ client });

      await expect(
        shelterUpdateRepository.updateShelter('shelter-a', validInput, 'user-1'),
      ).rejects.toBeInstanceOf(SupabaseShelterUpdateRepositoryError);
    });
  });
});
