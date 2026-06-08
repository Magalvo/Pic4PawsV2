import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { AdoptionViewRecord, AdoptionViewRepository } from './adoption-view';
import type { AdoptionApplicationStatus } from './adoption-list';

export class SupabaseAdoptionViewRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAdoptionViewRepositoryError';
  }
}

export type CreateSupabaseAdoptionViewRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseAdoptionViewRepositoriesResult = {
  adoptionViewRepository: AdoptionViewRepository;
};

type AdoptionViewRow = {
  id: string;
  shelter_id: string;
  user_id: string;
  pet_id: string | null;
  status: AdoptionApplicationStatus;
};

const adoptionViewColumns = 'id,shelter_id,user_id,pet_id,status';

const toAdoptionViewRecord = (row: AdoptionViewRow): AdoptionViewRecord => ({
  applicationId: row.id,
  shelterId: row.shelter_id,
  applicantUserId: row.user_id,
  petId: row.pet_id,
  applicationStatus: row.status,
});

export const createSupabaseAdoptionViewRepositories = ({
  client,
}: CreateSupabaseAdoptionViewRepositoriesInput): CreateSupabaseAdoptionViewRepositoriesResult => {
  const adoptionViewRepository: AdoptionViewRepository = {
    getAdoptionView: async (applicationId: string): Promise<AdoptionViewRecord | null> => {
      const result = (await client
        .from('adoption_applications')
        .select(adoptionViewColumns)
        .eq('id', applicationId)
        .maybeSingle()) as SupabaseQueryResult<AdoptionViewRow | null>;

      if (result.error) {
        throw new SupabaseAdoptionViewRepositoryError(
          `Failed to load adoption view: ${result.error.message}`,
        );
      }

      if (!result.data) return null;

      return toAdoptionViewRecord(result.data);
    },
  };

  return { adoptionViewRepository };
};
