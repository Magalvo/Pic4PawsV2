import type { SupabaseClientLike } from './pet-supabase';
import type { ShelterVerificationRepository } from './shelter-verify';
import type { ShelterVerificationStatus } from './shelter-profile';

export class SupabaseShelterVerifyRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterVerifyRepositoryError';
  }
}

export type CreateSupabaseShelterVerifyRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterVerifyRepositoriesResult = {
  shelterVerificationRepository: ShelterVerificationRepository;
};

export const createSupabaseShelterVerifyRepositories = ({
  client,
}: CreateSupabaseShelterVerifyRepositoriesInput): CreateSupabaseShelterVerifyRepositoriesResult => {
  const shelterVerificationRepository: ShelterVerificationRepository = {
    loadVerificationStatus: async (shelterId) => {
      const result = await client
        .from('shelters')
        .select('id,verification_status')
        .eq('id', shelterId)
        .is('deleted_at', null)
        .maybeSingle();

      if (result.error) {
        throw new SupabaseShelterVerifyRepositoryError(
          `Failed to load shelter verification status: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) return null;

      const row = result.data as { id: string; verification_status: ShelterVerificationStatus };
      return { currentStatus: row.verification_status };
    },

    updateVerificationStatus: async (shelterId, targetStatus) => {
      const result = await client
        .from('shelters')
        .update({ verification_status: targetStatus })
        .eq('id', shelterId)
        .is('deleted_at', null)
        .select('id')
        .maybeSingle();

      if (result.error) {
        throw new SupabaseShelterVerifyRepositoryError(
          `Failed to update shelter verification status: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) return null;

      return { shelterId: (result.data as { id: string }).id };
    },
  };

  return { shelterVerificationRepository };
};
