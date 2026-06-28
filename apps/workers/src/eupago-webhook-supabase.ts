import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';

export type EupagoWebhookRepository = {
  getShelterId(providerPaymentId: string): Promise<string | null>;
  getEncryptedEupagoWebhookSecret(shelterId: string): Promise<string | null>;
  getIfthenpayAntiPhishingKey(shelterId: string): Promise<string | null>;
};

export const createEupagoWebhookRepositories = ({
  client,
}: {
  client: SupabaseClientLike;
}): EupagoWebhookRepository => ({
  getShelterId: async (providerPaymentId: string): Promise<string | null> => {
    const result = (await client
      .from('donation_transactions')
      .select('shelter_id')
      .eq('provider_payment_id', providerPaymentId)
      .maybeSingle()) as SupabaseQueryResult<{ shelter_id: string }>;
    if (result.error || !result.data) return null;
    return result.data.shelter_id;
  },

  getEncryptedEupagoWebhookSecret: async (shelterId: string): Promise<string | null> => {
    const result = (await client
      .from('shelter_payment_configs')
      .select('eupago_webhook_secret_encrypted')
      .eq('shelter_id', shelterId)
      .is('deleted_at', null)
      .maybeSingle()) as SupabaseQueryResult<{ eupago_webhook_secret_encrypted: string | null }>;
    if (result.error || !result.data) return null;
    return result.data.eupago_webhook_secret_encrypted;
  },

  getIfthenpayAntiPhishingKey: async (shelterId: string): Promise<string | null> => {
    const result = (await client
      .from('shelter_payment_configs')
      .select('ifthenpay_anti_phishing_key')
      .eq('shelter_id', shelterId)
      .is('deleted_at', null)
      .maybeSingle()) as SupabaseQueryResult<{ ifthenpay_anti_phishing_key: string | null }>;
    if (result.error || !result.data) return null;
    return result.data.ifthenpay_anti_phishing_key;
  },
});
