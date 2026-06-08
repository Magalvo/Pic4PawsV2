import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { DonationPaymentMethod } from './donation';
import type { SponsorshipRecurringInterval } from './sponsorship';
import type {
  SponsorshipListRepository,
  SponsorshipListSummary,
  SponsorshipStatus,
  ListSponsorshipsQuery,
  ListSponsorshipsResult,
} from './sponsorship-list';

export class SupabaseSponsorshipListRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseSponsorshipListRepositoryError';
  }
}

export type CreateSupabaseSponsorshipListRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseSponsorshipListRepositoriesResult = {
  sponsorshipListRepository: SponsorshipListRepository;
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

const sponsorshipListColumns =
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

export const createSupabaseSponsorshipListRepositories = ({
  client,
}: CreateSupabaseSponsorshipListRepositoriesInput): CreateSupabaseSponsorshipListRepositoriesResult => {
  const sponsorshipListRepository: SponsorshipListRepository = {
    listSponsorships: async ({
      shelterId,
      limit = 20,
      offset = 0,
    }: ListSponsorshipsQuery): Promise<ListSponsorshipsResult> => {
      const result = (await client
        .from('sponsorships')
        .select(sponsorshipListColumns, { count: 'exact' })
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<SponsorshipRow[]>;

      if (result.error) {
        throw new SupabaseSponsorshipListRepositoryError(
          `Failed to list sponsorships: ${result.error.message ?? 'unknown error'}`,
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

  return { sponsorshipListRepository };
};
