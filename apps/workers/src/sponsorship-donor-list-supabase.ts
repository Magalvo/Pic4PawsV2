import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { DonationPaymentMethod } from './donation';
import type { SponsorshipRecurringInterval } from './sponsorship';
import type { SponsorshipListSummary, SponsorshipStatus } from './sponsorship-list';
import type {
  SponsorshipDonorListRepository,
  ListDonorSponsorshipsQuery,
  ListDonorSponsorshipsResult,
} from './sponsorship-donor-list';

export class SupabaseSponsorshipDonorListRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseSponsorshipDonorListRepositoryError';
  }
}

export type CreateSupabaseSponsorshipDonorListRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseSponsorshipDonorListRepositoriesResult = {
  sponsorshipDonorListRepository: SponsorshipDonorListRepository;
};

type SponsorshipRow = {
  id: string;
  amount_cents: number;
  currency: string;
  payment_method: DonationPaymentMethod;
  recurring_interval: SponsorshipRecurringInterval;
  status: SponsorshipStatus;
  pet_id: string | null;
  created_at: string;
};

const sponsorshipColumns =
  'id,amount_cents,currency,payment_method,recurring_interval,status,pet_id,created_at';

const toSponsorshipListSummary = (row: SponsorshipRow): SponsorshipListSummary => ({
  sponsorshipId: row.id,
  amountCents: row.amount_cents,
  currency: row.currency,
  paymentMethod: row.payment_method,
  recurringInterval: row.recurring_interval,
  status: row.status,
  petId: row.pet_id,
  createdAt: row.created_at,
});

export const createSupabaseSponsorshipDonorListRepositories = ({
  client,
}: CreateSupabaseSponsorshipDonorListRepositoriesInput): CreateSupabaseSponsorshipDonorListRepositoriesResult => {
  const sponsorshipDonorListRepository: SponsorshipDonorListRepository = {
    listDonorSponsorships: async ({
      donorUserId,
      limit = 20,
      offset = 0,
    }: ListDonorSponsorshipsQuery): Promise<ListDonorSponsorshipsResult> => {
      const result = (await client
        .from('sponsorships')
        .select(sponsorshipColumns, { count: 'exact' })
        .eq('donor_user_id', donorUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<SponsorshipRow[]>;

      if (result.error) {
        throw new SupabaseSponsorshipDonorListRepositoryError(
          `Failed to list donor sponsorships: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const rows = result.data ?? [];
      const total = result.count ?? 0;

      return {
        sponsorships: rows.map(toSponsorshipListSummary),
        total,
      };
    },
  };

  return { sponsorshipDonorListRepository };
};
