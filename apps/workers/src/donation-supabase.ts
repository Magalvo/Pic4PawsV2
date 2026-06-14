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

type DonationEligibilityShelterRow = {
  id: string;
  verification_status: 'draft' | 'pending_review' | 'verified' | 'rejected' | 'suspended';
  payment_account_status: 'not_configured' | 'pending' | 'active' | 'disabled';
};

type DonationEligibilityPetRow = {
  id: string;
  shelter_id: string;
};

const assertSupabaseResult = <TData>(
  result: SupabaseQueryResult<unknown>,
  failureMessage: string,
): TData => {
  if (result.error) {
    throw new SupabaseDonationRepositoryError(failureMessage);
  }

  return result.data as TData;
};

export const createSupabaseDonationRepositories = ({
  client,
  generateId = () => crypto.randomUUID(),
}: CreateSupabaseDonationRepositoriesInput): CreateSupabaseDonationRepositoriesResult => {
  const donationRepository: DonationRepository = {
    getDonationEligibilityContext: async ({ shelterId, petId }) => {
      const shelterResult = await client
        .from('shelters')
        .select('id,verification_status,payment_account_status')
        .eq('id', shelterId)
        .maybeSingle();
      const shelterRow = assertSupabaseResult<DonationEligibilityShelterRow | null>(
        shelterResult,
        'Failed to load donation shelter eligibility',
      );

      let petRow: DonationEligibilityPetRow | null = null;
      if (petId) {
        const petResult = await client
          .from('pets')
          .select('id,shelter_id')
          .eq('id', petId)
          .maybeSingle();
        petRow = assertSupabaseResult<DonationEligibilityPetRow | null>(
          petResult,
          'Failed to load donation pet eligibility',
        );
      }

      return {
        shelter: shelterRow
          ? {
              id: shelterRow.id,
              verificationStatus: shelterRow.verification_status,
              paymentAccountStatus: shelterRow.payment_account_status,
            }
          : null,
        pet: petRow ? { id: petRow.id, shelterId: petRow.shelter_id } : null,
      };
    },
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
