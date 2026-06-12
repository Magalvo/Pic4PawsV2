import { describe, expect, it, vi } from 'vitest';
import {
  createSupabaseShelterRegistrationRepositories,
  SupabaseShelterRegistrationRepositoryError,
} from '../../apps/workers/src/shelter-register-supabase';
import type { ShelterRegistrationInput } from '../../apps/workers/src/shelter-register';

const makeClient = (shelterResult: unknown, memberResult: unknown) => {
  let callCount = 0;
  return {
    from: vi.fn().mockImplementation(() => {
      callCount += 1;
      const chain: Record<string, unknown> = {};
      const result = callCount === 1 ? shelterResult : memberResult;
      chain['insert'] = vi.fn().mockReturnValue(chain);
      chain['select'] = vi.fn().mockReturnValue(chain);
      chain['single'] = vi.fn().mockResolvedValue(result);
      return chain;
    }),
  };
};

const validInput: ShelterRegistrationInput = {
  name: 'Canil de Lisboa',
  kind: 'shelter',
  city: 'Lisboa',
  publicEmail: null,
  publicPhone: null,
  description: null,
  district: null,
};

describe('createSupabaseShelterRegistrationRepositories', () => {
  describe('registerShelter', () => {
    it('inserts a shelter and membership, returns shelterId', async () => {
      const client = makeClient(
        { data: { id: 'shelter-uuid' }, error: null },
        { data: { id: 'membership-uuid' }, error: null },
      );
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      const result = await shelterRegistrationRepository.registerShelter(validInput, 'user-1');

      expect(typeof result.shelterId).toBe('string');
      expect(result.shelterId).toHaveLength(36);
      expect(client.from).toHaveBeenCalledWith('shelters');
      expect(client.from).toHaveBeenCalledWith('shelter_memberships');
    });

    it('generates a slug from the shelter name', async () => {
      const client = makeClient(
        { data: { id: 'shelter-uuid' }, error: null },
        { data: { id: 'membership-uuid' }, error: null },
      );
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await shelterRegistrationRepository.registerShelter(
        { ...validInput, name: 'Canil de São João' },
        'user-1',
      );

      const fromMock = client.from as ReturnType<typeof vi.fn>;
      const shelterCall = fromMock.mock.results[0].value;
      const insertMock = shelterCall.insert as ReturnType<typeof vi.fn>;
      const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
      expect(insertArg.slug).toBe('canil-de-sao-joao');
    });

    it('sets verification_status to draft and country_code to PT', async () => {
      const client = makeClient(
        { data: { id: 'shelter-uuid' }, error: null },
        { data: { id: 'membership-uuid' }, error: null },
      );
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await shelterRegistrationRepository.registerShelter(validInput, 'user-1');

      const fromMock = client.from as ReturnType<typeof vi.fn>;
      const shelterCall = fromMock.mock.results[0].value;
      const insertMock = shelterCall.insert as ReturnType<typeof vi.fn>;
      const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
      expect(insertArg.verification_status).toBe('draft');
      expect(insertArg.country_code).toBe('PT');
    });

    it('assigns shelter_owner role to the first member', async () => {
      const client = makeClient(
        { data: { id: 'shelter-uuid' }, error: null },
        { data: { id: 'membership-uuid' }, error: null },
      );
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await shelterRegistrationRepository.registerShelter(validInput, 'user-owner');

      const fromMock = client.from as ReturnType<typeof vi.fn>;
      const membershipCall = fromMock.mock.results[1].value;
      const insertMock = membershipCall.insert as ReturnType<typeof vi.fn>;
      const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
      expect(insertArg.role).toBe('shelter_owner');
      expect(insertArg.user_id).toBe('user-owner');
    });

    it('throws SupabaseShelterRegistrationRepositoryError when shelter insert fails', async () => {
      const client = makeClient(
        { data: null, error: { message: 'unique violation' } },
        { data: { id: 'membership-uuid' }, error: null },
      );
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await expect(
        shelterRegistrationRepository.registerShelter(validInput, 'user-1'),
      ).rejects.toBeInstanceOf(SupabaseShelterRegistrationRepositoryError);
    });

    it('throws SupabaseShelterRegistrationRepositoryError when membership insert fails', async () => {
      const client = makeClient(
        { data: { id: 'shelter-uuid' }, error: null },
        { data: null, error: { message: 'fk violation' } },
      );
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await expect(
        shelterRegistrationRepository.registerShelter(validInput, 'user-1'),
      ).rejects.toBeInstanceOf(SupabaseShelterRegistrationRepositoryError);
    });
  });
});
