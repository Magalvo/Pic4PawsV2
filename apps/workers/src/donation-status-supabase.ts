import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { DonationStatusRecord, DonationStatusRepository } from './donation-status';
import type { DonationKind, DonationPaymentMethod } from './donation';
import type { DonationStatus } from './donation-list';

export class SupabaseDonationStatusRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseDonationStatusRepositoryError';
  }
}

export type CreateSupabaseDonationStatusRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseDonationStatusRepositoriesResult = {
  donationStatusRepository: DonationStatusRepository;
};

type DonationStatusRow = {
  id: string;
  donor_user_id: string;
  shelter_id: string;
  pet_id: string | null;
  kind: DonationKind;
  status: DonationStatus;
  amount_cents: number;
  currency: string;
  payment_method: DonationPaymentMethod;
  created_at: string;
};

const donationStatusColumns =
  'id,donor_user_id,shelter_id,pet_id,kind,status,amount_cents,currency,payment_method,created_at';

const toDonationStatusRecord = (row: DonationStatusRow): DonationStatusRecord => ({
  donationId: row.id,
  donorUserId: row.donor_user_id,
  shelterId: row.shelter_id,
  petId: row.pet_id,
  kind: row.kind,
  donationStatus: row.status,
  amountCents: row.amount_cents,
  currency: row.currency,
  paymentMethod: row.payment_method,
  createdAt: row.created_at,
});

export const createSupabaseDonationStatusRepositories = ({
  client,
}: CreateSupabaseDonationStatusRepositoriesInput): CreateSupabaseDonationStatusRepositoriesResult => {
  const donationStatusRepository: DonationStatusRepository = {
    getDonationStatus: async (donationId: string): Promise<DonationStatusRecord | null> => {
      const result = (await client
        .from('donation_transactions')
        .select(donationStatusColumns)
        .eq('id', donationId)
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<DonationStatusRow | null>;

      if (result.error) {
        throw new SupabaseDonationStatusRepositoryError(
          `Failed to load donation status: ${result.error.message}`,
        );
      }

      if (!result.data) return null;

      return toDonationStatusRecord(result.data);
    },
  };

  return { donationStatusRepository };
};
