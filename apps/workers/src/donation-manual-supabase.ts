import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  ApproveInput,
  DonationForAction,
  DonationManualRepository,
  RejectInput,
} from './donation-manual';

export class SupabaseDonationManualRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseDonationManualRepositoryError';
  }
}

export type CreateSupabaseDonationManualRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseDonationManualRepositoriesResult = {
  donationManualRepository: DonationManualRepository;
};

type DonationForActionRow = {
  id: string;
  donor_user_id: string;
  shelter_id: string;
  status: string;
  provider_payment_id: string;
  provider: string;
};

type MediaAssetOwnerRow = {
  id: string;
};

export const createSupabaseDonationManualRepositories = ({
  client,
}: CreateSupabaseDonationManualRepositoriesInput): CreateSupabaseDonationManualRepositoriesResult => {
  const donationManualRepository: DonationManualRepository = {
    getDonationForAction: async (donationId: string): Promise<DonationForAction | null> => {
      const result = (await client
        .from('donation_transactions')
        .select('id,donor_user_id,shelter_id,status,provider_payment_id,provider')
        .eq('id', donationId)
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<DonationForActionRow>;

      if (result.error) {
        throw new SupabaseDonationManualRepositoryError(
          `Failed to load donation for action: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) return null;

      return {
        donationId: result.data.id,
        donorUserId: result.data.donor_user_id,
        shelterId: result.data.shelter_id,
        status: result.data.status,
        providerPaymentId: result.data.provider_payment_id,
        provider: result.data.provider,
      };
    },

    verifyMediaOwnership: async (mediaId: string, ownerUserId: string): Promise<boolean> => {
      const result = (await client
        .from('media_assets')
        .select('id')
        .eq('id', mediaId)
        .eq('created_by_user_id', ownerUserId)
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<MediaAssetOwnerRow>;

      if (result.error) {
        throw new SupabaseDonationManualRepositoryError(
          `Failed to verify media ownership: ${result.error.message ?? 'unknown error'}`,
        );
      }

      return result.data !== null;
    },

    submitReceipt: async (donationId: string, receiptMediaId: string): Promise<boolean> => {
      const result = (await client
        .from('donation_transactions')
        .update({ receipt_media_id: receiptMediaId, status: 'pending_review' })
        .eq('id', donationId)
        .eq('status', 'pending_receipt')
        .select('id')) as SupabaseQueryResult<Array<{ id: string }>>;

      if (result.error) {
        throw new SupabaseDonationManualRepositoryError(
          `Failed to submit receipt: ${result.error.message ?? 'unknown error'}`,
        );
      }

      return (result.data?.length ?? 0) > 0;
    },

    approveDonation: async (donationId: string, input: ApproveInput): Promise<boolean> => {
      const result = (await client
        .from('donation_transactions')
        .update({
          status: 'paid',
          reviewed_by_user_id: input.reviewedByUserId,
          reviewed_at: input.reviewedAt,
          paid_at: input.paidAt,
        })
        .eq('id', donationId)
        .eq('status', 'pending_review')
        .select('id')) as SupabaseQueryResult<Array<{ id: string }>>;

      if (result.error) {
        throw new SupabaseDonationManualRepositoryError(
          `Failed to approve donation: ${result.error.message ?? 'unknown error'}`,
        );
      }

      return (result.data?.length ?? 0) > 0;
    },

    rejectDonation: async (donationId: string, input: RejectInput): Promise<boolean> => {
      const result = (await client
        .from('donation_transactions')
        .update({
          status: 'rejected',
          reviewed_by_user_id: input.reviewedByUserId,
          reviewed_at: input.reviewedAt,
        })
        .eq('id', donationId)
        .eq('status', 'pending_review')
        .select('id')) as SupabaseQueryResult<Array<{ id: string }>>;

      if (result.error) {
        throw new SupabaseDonationManualRepositoryError(
          `Failed to reject donation: ${result.error.message ?? 'unknown error'}`,
        );
      }

      return (result.data?.length ?? 0) > 0;
    },
  };

  return { donationManualRepository };
};
