import { describe, expect, it, vi } from 'vitest';
import {
  createSupabaseShelterRegistrationRepositories,
  SupabaseShelterRegistrationRepositoryError,
} from '../../apps/workers/src/shelter-register-supabase';
import type { ShelterRegistrationInput } from '../../apps/workers/src/shelter-register';

const makeClient = (result: unknown) => ({
  from: vi.fn(),
  rpc: vi.fn().mockResolvedValue(result),
});

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
    it('calls rpc register_shelter and returns shelterId', async () => {
      const shelterId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const client = makeClient({ data: shelterId, error: null });
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      const result = await shelterRegistrationRepository.registerShelter(validInput, 'user-1');

      expect(result.shelterId).toHaveLength(36);
      expect(client.rpc).toHaveBeenCalledWith('register_shelter', expect.any(Object));
      expect(client.from).not.toHaveBeenCalled();
    });

    it('passes slug generated from name as rpc arg', async () => {
      const client = makeClient({ data: 'some-uuid', error: null });
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await shelterRegistrationRepository.registerShelter(
        { ...validInput, name: 'Canil de São João' },
        'user-1',
      );

      const args = (client.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(args.p_slug).toBe('canil-de-sao-joao');
    });

    it('passes verification_status draft and country_code PT as rpc args', async () => {
      const client = makeClient({ data: 'some-uuid', error: null });
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await shelterRegistrationRepository.registerShelter(validInput, 'user-1');

      const args = (client.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(args.p_verification_status).toBe('draft');
      expect(args.p_country_code).toBe('PT');
    });

    it('passes shelter_owner role and actorUserId as rpc args', async () => {
      const client = makeClient({ data: 'some-uuid', error: null });
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await shelterRegistrationRepository.registerShelter(validInput, 'user-owner');

      const args = (client.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(args.p_role).toBe('shelter_owner');
      expect(args.p_user_id).toBe('user-owner');
    });

    it('returns the shelterId that was passed as p_shelter_id', async () => {
      const client = makeClient({ data: null, error: null });
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      const result = await shelterRegistrationRepository.registerShelter(validInput, 'user-1');

      const args = (client.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1] as Record<string, unknown>;
      expect(result.shelterId).toBe(args.p_shelter_id);
    });

    it('throws SupabaseShelterRegistrationRepositoryError on rpc error', async () => {
      const client = makeClient({ data: null, error: { message: 'unique violation' } });
      const { shelterRegistrationRepository } = createSupabaseShelterRegistrationRepositories({ client });

      await expect(
        shelterRegistrationRepository.registerShelter(validInput, 'user-1'),
      ).rejects.toBeInstanceOf(SupabaseShelterRegistrationRepositoryError);
    });
  });
});
