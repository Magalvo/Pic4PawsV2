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
  active_provider: string | null;
  eupago_api_key_encrypted: string | null;
  eupago_webhook_secret_encrypted: string | null;
  ifthenpay_anti_phishing_key: string | null;
};

export const createSupabaseShelterPaymentConfigRepositories = ({
  client,
}: CreateSupabaseShelterPaymentConfigRepositoriesInput): CreateSupabaseShelterPaymentConfigRepositoriesResult => {
  const shelterPaymentConfigRepository: ShelterPaymentConfigRepository = {
    getPaymentConfig: async (shelterId: string): Promise<ShelterPaymentConfigRecord | null> => {
      const result = (await client
        .from('shelter_payment_configs')
        .select(
          'tier,iban,mb_way_phone,active_provider,eupago_api_key_encrypted,eupago_webhook_secret_encrypted,ifthenpay_anti_phishing_key',
        )
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<ShelterPaymentConfigRow>;

      if (result.error) {
        throw new SupabaseShelterPaymentConfigRepositoryError(
          `Failed to get payment config: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) return null;

      const tier = result.data.tier === 'automated' ? 'automated' : 'manual';
      const ap = result.data.active_provider;

      return {
        tier,
        iban: result.data.iban,
        mbWayPhone: result.data.mb_way_phone,
        activeProvider: ap === 'eupago' || ap === 'ifthenpay' ? ap : null,
        eupagoApiKeyConfigured: result.data.eupago_api_key_encrypted !== null,
        ifthenpayAntiPhishingKeyConfigured: result.data.ifthenpay_anti_phishing_key !== null,
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
            tier: input.tier,
            iban: input.iban,
            mb_way_phone: input.mbWayPhone,
            active_provider: input.activeProvider,
            eupago_api_key_encrypted: input.eupagoApiKeyEncrypted,
            eupago_webhook_secret_encrypted: input.eupagoWebhookSecretEncrypted,
            ifthenpay_anti_phishing_key: input.ifthenpayAntiPhishingKey,
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

    checkPendingPaymentDonations: async (shelterId: string): Promise<boolean> => {
      const result = (await client
        .from('donation_transactions')
        .select('id', { count: 'exact' })
        .eq('shelter_id', shelterId)
        .eq('status', 'pending_payment')
        .is('deleted_at', null)) as SupabaseQueryResult<null> & { count: number | null };

      if (result.error) {
        throw new SupabaseShelterPaymentConfigRepositoryError(
          `Failed to check pending donations: ${result.error.message ?? 'unknown error'}`,
        );
      }

      return (result.count ?? 0) > 0;
    },
  };

  return { shelterPaymentConfigRepository };
};
