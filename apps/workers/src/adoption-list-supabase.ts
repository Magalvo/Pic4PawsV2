import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  AdoptionApplicationStatus,
  AdoptionListRepository,
  AdoptionListSummary,
  ListAdoptionApplicationsQuery,
  ListAdoptionApplicationsResult,
} from './adoption-list';

export class SupabaseAdoptionListRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAdoptionListRepositoryError';
  }
}

export type CreateSupabaseAdoptionListRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseAdoptionListRepositoriesResult = {
  adoptionListRepository: AdoptionListRepository;
};

type AdoptionApplicationRow = {
  id: string;
  pet_id: string;
  applicant_user_id: string;
  applicant_full_name: string;
  applicant_email: string;
  applicant_city: string;
  status: AdoptionApplicationStatus;
  submitted_at: string | null;
};

const adoptionListColumns =
  'id,pet_id,applicant_user_id,applicant_full_name,applicant_email,applicant_city,status,submitted_at';

const toAdoptionListSummary = (row: AdoptionApplicationRow): AdoptionListSummary => ({
  applicationId: row.id,
  petId: row.pet_id,
  applicantUserId: row.applicant_user_id,
  applicantFullName: row.applicant_full_name,
  applicantEmail: row.applicant_email,
  applicantCity: row.applicant_city,
  status: row.status,
  submittedAt: row.submitted_at,
});

export const createSupabaseAdoptionListRepositories = ({
  client,
}: CreateSupabaseAdoptionListRepositoriesInput): CreateSupabaseAdoptionListRepositoriesResult => {
  const adoptionListRepository: AdoptionListRepository = {
    listApplications: async ({
      shelterId,
      limit = 20,
      offset = 0,
    }: ListAdoptionApplicationsQuery): Promise<ListAdoptionApplicationsResult> => {
      const result = (await client
        .from('adoption_applications')
        .select(adoptionListColumns, { count: 'exact' })
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<AdoptionApplicationRow[]>;

      if (result.error) {
        throw new SupabaseAdoptionListRepositoryError(
          `Failed to list adoption applications: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const rows = result.data ?? [];
      const total = result.count ?? 0;

      return {
        applications: rows.map(toAdoptionListSummary),
        total,
      };
    },
  };

  return { adoptionListRepository };
};
