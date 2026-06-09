import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { PetArchiveRecord, PetArchiveRepository } from './pet-archive';

export class SupabasePetArchiveRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabasePetArchiveRepositoryError';
  }
}

export type CreateSupabasePetArchiveRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabasePetArchiveRepositoriesResult = {
  petArchiveRepository: PetArchiveRepository;
};

type PetArchiveRow = {
  id: string;
  shelter_id: string;
  lifecycle_status: string;
};

export const createSupabasePetArchiveRepositories = ({
  client,
}: CreateSupabasePetArchiveRepositoriesInput): CreateSupabasePetArchiveRepositoriesResult => {
  const petArchiveRepository: PetArchiveRepository = {
    getPetForArchive: async (petId: string): Promise<PetArchiveRecord | null> => {
      const result = (await client
        .from('pets')
        .select('id,shelter_id,lifecycle_status')
        .eq('id', petId)
        .single()) as SupabaseQueryResult<PetArchiveRow>;

      if (result.error || !result.data) return null;

      return {
        petId: result.data.id,
        shelterId: result.data.shelter_id,
        lifecycleStatus: result.data.lifecycle_status,
      };
    },

    archivePet: async ({
      petId,
      now,
    }: {
      petId: string;
      now: string;
    }): Promise<{ petId: string } | null> => {
      const result = (await client
        .from('pets')
        .update({ lifecycle_status: 'archived', archived_at: now })
        .eq('id', petId)
        .neq('lifecycle_status', 'archived')) as SupabaseQueryResult<PetArchiveRow[]>;

      if (result.error) {
        throw new SupabasePetArchiveRepositoryError(
          `Failed to archive pet: ${result.error.message ?? 'unknown error'}`,
        );
      }

      // If no rows were updated the pet was already archived
      const updated = Array.isArray(result.data) ? result.data : [];

      if (updated.length === 0) return null;

      return { petId };
    },

    republishPet: async ({
      petId,
    }: {
      petId: string;
      now: string;
    }): Promise<{ petId: string } | null> => {
      const result = (await client
        .from('pets')
        .update({ lifecycle_status: 'published', archived_at: null })
        .eq('id', petId)
        .eq('lifecycle_status', 'archived')) as SupabaseQueryResult<PetArchiveRow[]>;

      if (result.error) {
        throw new SupabasePetArchiveRepositoryError(
          `Failed to republish pet: ${result.error.message ?? 'unknown error'}`,
        );
      }

      // If no rows were updated the pet was not archived
      const updated = Array.isArray(result.data) ? result.data : [];

      if (updated.length === 0) return null;

      return { petId };
    },
  };

  return { petArchiveRepository };
};
