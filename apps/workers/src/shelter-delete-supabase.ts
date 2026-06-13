import type { SupabaseClientLike } from './pet-supabase';
import type { ShelterDeletionRepository } from './shelter-delete';

export class SupabaseShelterDeletionRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterDeletionRepositoryError';
  }
}

export type CreateSupabaseShelterDeletionRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterDeletionRepositoriesResult = {
  shelterDeletionRepository: ShelterDeletionRepository;
};

export const createSupabaseShelterDeletionRepositories = ({
  client,
}: CreateSupabaseShelterDeletionRepositoriesInput): CreateSupabaseShelterDeletionRepositoriesResult => {
  const shelterDeletionRepository: ShelterDeletionRepository = {
    deleteShelter: async (
      shelterId: string,
    ): Promise<{ shelterId: string } | null> => {
      const result = await client
        .from('shelters')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', shelterId)
        .is('deleted_at', null)
        .select('id')
        .maybeSingle();

      if (result.error) {
        throw new SupabaseShelterDeletionRepositoryError(
          `Failed to delete shelter: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) return null;

      return { shelterId: (result.data as { id: string }).id };
    },
  };

  return { shelterDeletionRepository };
};
