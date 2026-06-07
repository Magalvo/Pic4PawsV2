import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  DonationRepository,
  CreateDonationInput,
  CreateDonationResult,
} from './donation';

export class SupabaseDonationRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseDonationRepositoryError';
  }
}

export type CreateSupabaseDonationRepositoriesInput = {
  client: SupabaseClientLike;
  generateId?: () => string;
};

export type CreateSupabaseDonationRepositoriesResult = {
  donationRepository: DonationRepository;
};

type CreatedDonationRow = {
  id: string;
  created_at: string;
};

export const createSupabaseDonationRepositories = ({
  client,
  generateId = () => crypto.randomUUID(),
}: CreateSupabaseDonationRepositoriesInput): CreateSupabaseDonationRepositoriesResult => {
  const donationRepository: DonationRepository = {
    createDonation: async (input: CreateDonationInput): Promise<CreateDonationResult> => {
      const row = {
        donor_user_id: input.donorUserId,
        shelter_id: input.shelterId,
        pet_id: input.petId,
        kind: input.kind,
        status: 'created' as const,
        provider: input.provider,
        provider_payment_id: generateId(),
        idempotency_key: generateId(),
        amount_cents: input.amountCents,
        currency: 'EUR',
        payment_method: input.paymentMethod,
        anonymous: input.anonymous,
        donor_display_name: input.donorDisplayName,
        donor_email: input.donorEmail,
        public_message: input.publicMessage,
        raw_provider_event_ids: [],
        created_at: input.createdAt,
        updated_at: input.createdAt,
      };

      const result = (await client
        .from('donation_transactions')
        .insert(row)
        .select('id,created_at')
        .single()) as SupabaseQueryResult<CreatedDonationRow>;

      if (result.error || !result.data) {
        throw new SupabaseDonationRepositoryError(
          `Failed to create donation: ${result.error?.message ?? 'unknown error'}`,
        );
      }

      return {
        donationId: result.data.id,
        createdAt: result.data.created_at,
      };
    },
  };

  return { donationRepository };
};
