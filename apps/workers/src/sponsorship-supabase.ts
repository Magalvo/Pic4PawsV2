import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  SponsorshipRepository,
  CreateSponsorshipInput,
  CreateSponsorshipResult,
} from './sponsorship';

export class SupabaseSponsorshipRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseSponsorshipRepositoryError';
  }
}

export type CreateSupabaseSponsorshipRepositoriesInput = {
  client: SupabaseClientLike;
  generateId?: () => string;
};

export type CreateSupabaseSponsorshipRepositoriesResult = {
  sponsorshipRepository: SponsorshipRepository;
};

type CreatedSponsorshipRow = {
  id: string;
  created_at: string;
};

export const createSupabaseSponsorshipRepositories = ({
  client,
  generateId = () => crypto.randomUUID(),
}: CreateSupabaseSponsorshipRepositoriesInput): CreateSupabaseSponsorshipRepositoriesResult => {
  const sponsorshipRepository: SponsorshipRepository = {
    createSponsorship: async (
      input: CreateSponsorshipInput,
    ): Promise<CreateSponsorshipResult> => {
      const row = {
        donor_user_id: input.donorUserId,
        shelter_id: input.shelterId,
        pet_id: input.petId,
        amount_cents: input.amountCents,
        currency: input.currency,
        payment_method: input.paymentMethod,
        recurring_interval: input.recurringInterval,
        provider: input.provider,
        provider_subscription_id: generateId(),
        status: 'active' as const,
        created_at: input.createdAt,
        updated_at: input.createdAt,
      };

      const result = (await client
        .from('sponsorships')
        .insert(row)
        .select('id,created_at')
        .single()) as SupabaseQueryResult<CreatedSponsorshipRow>;

      if (result.error || !result.data) {
        throw new SupabaseSponsorshipRepositoryError(
          `Failed to create sponsorship: ${result.error?.message ?? 'unknown error'}`,
        );
      }

      return {
        sponsorshipId: result.data.id,
        createdAt: result.data.created_at,
      };
    },
  };

  return { sponsorshipRepository };
};
