import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { SponsorshipStatus } from './sponsorship-list';
import type {
  GetSponsorshipForManageResult,
  SponsorshipManageRepository,
  UpdateSponsorshipStatusInput,
} from './sponsorship-manage';

export class SupabaseSponsorshipManageRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseSponsorshipManageRepositoryError';
  }
}

export type CreateSupabaseSponsorshipManageRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseSponsorshipManageRepositoriesResult = {
  sponsorshipManageRepository: SponsorshipManageRepository;
};

type SponsorshipManageRow = {
  id: string;
  shelter_id: string;
  donor_user_id: string;
  status: SponsorshipStatus;
};

export const createSupabaseSponsorshipManageRepositories = ({
  client,
}: CreateSupabaseSponsorshipManageRepositoriesInput): CreateSupabaseSponsorshipManageRepositoriesResult => {
  const sponsorshipManageRepository: SponsorshipManageRepository = {
    getSponsorshipForManage: async (
      sponsorshipId: string,
    ): Promise<GetSponsorshipForManageResult | null> => {
      const result = (await client
        .from('sponsorships')
        .select('id,shelter_id,donor_user_id,status')
        .eq('id', sponsorshipId)
        .single()) as SupabaseQueryResult<SponsorshipManageRow>;

      if (result.error || !result.data) return null;

      return {
        sponsorshipId: result.data.id,
        shelterId: result.data.shelter_id,
        donorUserId: result.data.donor_user_id,
        currentStatus: result.data.status,
      };
    },

    updateSponsorshipStatus: async ({
      sponsorshipId,
      status,
    }: UpdateSponsorshipStatusInput): Promise<void> => {
      const result = (await client
        .from('sponsorships')
        .update({ status })
        .eq('id', sponsorshipId)) as SupabaseQueryResult<unknown>;

      if (result.error) {
        throw new SupabaseSponsorshipManageRepositoryError(
          `Failed to update sponsorship status: ${result.error.message ?? 'unknown error'}`,
        );
      }
    },
  };

  return { sponsorshipManageRepository };
};
