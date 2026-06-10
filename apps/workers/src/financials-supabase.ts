import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  FinancialsDonationBreakdown,
  FinancialsRepository,
  FinancialsSummary,
  GetFinancialsResult,
} from './financials';
import type { DonationStatus } from './donation-list';
import type { SponsorshipStatus } from './sponsorship-list';

export class SupabaseFinancialsRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseFinancialsRepositoryError';
  }
}

export type CreateSupabaseFinancialsRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseFinancialsRepositoriesResult = {
  financialsRepository: FinancialsRepository;
};

type DonationAggRow = {
  status: DonationStatus;
  amount_cents: number;
  currency: string;
};

type SponsorshipAggRow = {
  status: SponsorshipStatus;
  amount_cents: number;
};

export const createSupabaseFinancialsRepositories = ({
  client,
}: CreateSupabaseFinancialsRepositoriesInput): CreateSupabaseFinancialsRepositoriesResult => {
  const financialsRepository: FinancialsRepository = {
    getFinancials: async (shelterId: string): Promise<GetFinancialsResult> => {
      const donationsResult = (await client
        .from('donation_transactions')
        .select('status,amount_cents,currency')
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)) as SupabaseQueryResult<DonationAggRow[]>;

      if (donationsResult.error) {
        throw new SupabaseFinancialsRepositoryError(
          `Failed to load donation financials: ${donationsResult.error.message ?? 'unknown error'}`,
        );
      }

      const donationRows: DonationAggRow[] = Array.isArray(donationsResult.data)
        ? donationsResult.data
        : [];

      const sponsorshipsResult = (await client
        .from('sponsorships')
        .select('status,amount_cents')
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)) as SupabaseQueryResult<SponsorshipAggRow[]>;

      if (sponsorshipsResult.error) {
        throw new SupabaseFinancialsRepositoryError(
          `Failed to load sponsorship financials: ${sponsorshipsResult.error.message ?? 'unknown error'}`,
        );
      }

      const sponsorshipRows: SponsorshipAggRow[] = Array.isArray(sponsorshipsResult.data)
        ? sponsorshipsResult.data
        : [];

      const currency = donationRows[0]?.currency ?? 'EUR';

      // Aggregate donations
      const donationsByStatus = new Map<DonationStatus, { count: number; totalCents: number }>();
      for (const row of donationRows) {
        const existing = donationsByStatus.get(row.status) ?? { count: 0, totalCents: 0 };
        donationsByStatus.set(row.status, {
          count: existing.count + 1,
          totalCents: existing.totalCents + row.amount_cents,
        });
      }

      const byStatus: FinancialsDonationBreakdown[] = Array.from(donationsByStatus.entries()).map(
        ([status, agg]) => ({ status, count: agg.count, totalCents: agg.totalCents }),
      );

      const paidEntry = donationsByStatus.get('paid');
      const paidTotalCents = paidEntry?.totalCents ?? 0;

      // Aggregate sponsorships
      let activeCount = 0;
      let pausedCount = 0;
      let cancelledCount = 0;
      let activeTotalCents = 0;

      for (const row of sponsorshipRows) {
        if (row.status === 'active') {
          activeCount++;
          activeTotalCents += row.amount_cents;
        } else if (row.status === 'paused') {
          pausedCount++;
        } else if (row.status === 'cancelled') {
          cancelledCount++;
        }
      }

      const summary: FinancialsSummary = {
        shelterId,
        currency,
        donations: {
          count: donationRows.length,
          paidTotalCents,
          byStatus,
        },
        sponsorships: {
          activeCount,
          pausedCount,
          cancelledCount,
          activeTotalCents,
        },
      };

      return summary;
    },
  };

  return { financialsRepository };
};
