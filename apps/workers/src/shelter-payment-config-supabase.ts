import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  ShelterPaymentConfigInput,
  ShelterPaymentConfigRecord,
  ShelterPaymentConfigRepository,
} from './shelter-payment-config';

export class SupabaseShelterPaymentConfigRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterPaymentConfigRepositoryError';
  }
}

export type CreateSupabaseShelterPaymentConfigRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterPaymentConfigRepositoriesResult = {
  shelterPaymentConfigRepository: ShelterPaymentConfigRepository;
};

type ShelterPaymentConfigRow = {
  tier: string;
  iban: string | null;
  mb_way_phone: string | null;
};

export const createSupabaseShelterPaymentConfigRepositories = ({
  client,
}: CreateSupabaseShelterPaymentConfigRepositoriesInput): CreateSupabaseShelterPaymentConfigRepositoriesResult => {
  const shelterPaymentConfigRepository: ShelterPaymentConfigRepository = {
    getPaymentConfig: async (shelterId: string): Promise<ShelterPaymentConfigRecord | null> => {
      const result = (await client
        .from('shelter_payment_configs')
        .select('tier,iban,mb_way_phone')
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<ShelterPaymentConfigRow>;

      if (result.error) {
        throw new SupabaseShelterPaymentConfigRepositoryError(
          `Failed to get payment config: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) return null;

      return {
        tier: 'manual',
        iban: result.data.iban,
        mbWayPhone: result.data.mb_way_phone,
      };
    },

    savePaymentConfig: async (
      shelterId: string,
      input: ShelterPaymentConfigInput,
    ): Promise<void> => {
      const upsertResult = (await client
        .from('shelter_payment_configs')
        .upsert(
          {
            shelter_id: shelterId,
            tier: 'manual',
            iban: input.iban,
            mb_way_phone: input.mbWayPhone,
            status: 'active',
          },
          { onConflict: 'shelter_id' },
        )) as SupabaseQueryResult<unknown>;

      if (upsertResult.error) {
        throw new SupabaseShelterPaymentConfigRepositoryError(
          `Failed to save payment config: ${upsertResult.error.message ?? 'unknown error'}`,
        );
      }

      const activateResult = (await client
        .from('shelters')
        .update({ payment_account_status: 'active' })
        .eq('id', shelterId)
        .is('deleted_at', null)) as SupabaseQueryResult<unknown>;

      if (activateResult.error) {
        throw new SupabaseShelterPaymentConfigRepositoryError(
          `Failed to activate shelter payment account: ${activateResult.error.message ?? 'unknown error'}`,
        );
      }
    },
  };

  return { shelterPaymentConfigRepository };
};
