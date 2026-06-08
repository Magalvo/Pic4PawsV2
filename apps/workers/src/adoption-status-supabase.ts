import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { AdoptionApplicationStatus } from './adoption-list';
import type {
  AdoptionStatusRecord,
  AdoptionStatusRepository,
  UpdateAdoptionStatusInput,
} from './adoption-status';

export class SupabaseAdoptionStatusRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAdoptionStatusRepositoryError';
  }
}

export type CreateSupabaseAdoptionStatusRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseAdoptionStatusRepositoriesResult = {
  adoptionStatusRepository: AdoptionStatusRepository;
};

type AdoptionStatusRow = {
  id: string;
  shelter_id: string;
  status: AdoptionApplicationStatus;
};

export const createSupabaseAdoptionStatusRepositories = ({
  client,
}: CreateSupabaseAdoptionStatusRepositoriesInput): CreateSupabaseAdoptionStatusRepositoriesResult => {
  const adoptionStatusRepository: AdoptionStatusRepository = {
    getAdoptionForStatus: async (applicationId: string): Promise<AdoptionStatusRecord | null> => {
      const result = (await client
        .from('adoption_applications')
        .select('id,shelter_id,status')
        .eq('id', applicationId)
        .single()) as SupabaseQueryResult<AdoptionStatusRow>;

      if (result.error || !result.data) return null;

      return {
        applicationId: result.data.id,
        shelterId: result.data.shelter_id,
        currentStatus: result.data.status,
      };
    },

    updateAdoptionStatus: async ({
      applicationId,
      status,
    }: UpdateAdoptionStatusInput): Promise<void> => {
      const result = (await client
        .from('adoption_applications')
        .update({ status })
        .eq('id', applicationId)) as SupabaseQueryResult<unknown>;

      if (result.error) {
        throw new SupabaseAdoptionStatusRepositoryError(
          `Failed to update adoption status: ${result.error.message ?? 'unknown error'}`,
        );
      }
    },
  };

  return { adoptionStatusRepository };
};
