import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { AdoptionApplicationStatus } from './adoption-list';
import type {
  AdoptionDonorListRepository,
  AdoptionDonorListSummary,
  ListDonorAdoptionsQuery,
  ListDonorAdoptionsResult,
} from './adoption-donor-list';

export class SupabaseAdoptionDonorListRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAdoptionDonorListRepositoryError';
  }
}

export type CreateSupabaseAdoptionDonorListRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseAdoptionDonorListRepositoriesResult = {
  adoptionDonorListRepository: AdoptionDonorListRepository;
};

type AdoptionDonorListRow = {
  id: string;
  pet_id: string;
  shelter_id: string;
  status: AdoptionApplicationStatus;
  submitted_at: string | null;
};

const donorListColumns = 'id,pet_id,shelter_id,status,submitted_at';

const toAdoptionDonorListSummary = (row: AdoptionDonorListRow): AdoptionDonorListSummary => ({
  applicationId: row.id,
  petId: row.pet_id,
  shelterId: row.shelter_id,
  status: row.status,
  submittedAt: row.submitted_at,
});

export const createSupabaseAdoptionDonorListRepositories = ({
  client,
}: CreateSupabaseAdoptionDonorListRepositoriesInput): CreateSupabaseAdoptionDonorListRepositoriesResult => {
  const adoptionDonorListRepository: AdoptionDonorListRepository = {
    listDonorAdoptions: async ({
      donorUserId,
      limit = 20,
      offset = 0,
    }: ListDonorAdoptionsQuery): Promise<ListDonorAdoptionsResult> => {
      const result = (await client
        .from('adoption_applications')
        .select(donorListColumns, { count: 'exact' })
        .eq('applicant_user_id', donorUserId)
        .is('deleted_at', null)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<AdoptionDonorListRow[]>;

      if (result.error) {
        throw new SupabaseAdoptionDonorListRepositoryError(
          `Failed to list donor adoptions: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const rows = result.data ?? [];
      const total = result.count ?? 0;

      return {
        applications: rows.map(toAdoptionDonorListSummary),
        total,
      };
    },
  };

  return { adoptionDonorListRepository };
};
