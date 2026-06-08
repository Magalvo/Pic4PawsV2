import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  DonationKind,
  DonationPaymentMethod,
} from './donation';
import type {
  DonationListRepository,
  DonationListSummary,
  DonationStatus,
  ListDonationsQuery,
  ListDonationsResult,
} from './donation-list';

export class SupabaseDonationListRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseDonationListRepositoryError';
  }
}

export type CreateSupabaseDonationListRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseDonationListRepositoriesResult = {
  donationListRepository: DonationListRepository;
};

type DonationTransactionRow = {
  id: string;
  kind: DonationKind;
  status: DonationStatus;
  amount_cents: number;
  currency: string;
  payment_method: DonationPaymentMethod;
  anonymous: boolean;
  donor_display_name: string | null;
  public_message: string | null;
  created_at: string;
};

const donationListColumns =
  'id,kind,status,amount_cents,currency,payment_method,anonymous,donor_display_name,public_message,created_at';

const toDonationListSummary = (row: DonationTransactionRow): DonationListSummary => ({
  donationId: row.id,
  kind: row.kind,
  status: row.status,
  amountCents: row.amount_cents,
  currency: row.currency,
  paymentMethod: row.payment_method,
  anonymous: row.anonymous,
  donorDisplayName: row.donor_display_name,
  publicMessage: row.public_message,
  createdAt: row.created_at,
});

export const createSupabaseDonationListRepositories = ({
  client,
}: CreateSupabaseDonationListRepositoriesInput): CreateSupabaseDonationListRepositoriesResult => {
  const donationListRepository: DonationListRepository = {
    listDonations: async ({
      shelterId,
      limit = 20,
      offset = 0,
    }: ListDonationsQuery): Promise<ListDonationsResult> => {
      const result = (await client
        .from('donation_transactions')
        .select(donationListColumns, { count: 'exact' })
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<DonationTransactionRow[]>;

      if (result.error) {
        throw new SupabaseDonationListRepositoryError(
          `Failed to list donation transactions: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const rows = result.data ?? [];
      const total = result.count ?? 0;

      return {
        donations: rows.map(toDonationListSummary),
        total,
      };
    },
  };

  return { donationListRepository };
};
