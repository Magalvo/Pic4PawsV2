import { decryptCredential } from './crypto';
import { createEupagoReferenceAdapter } from './eupago-reference-adapter';
import { createIfthenpayReferenceAdapter } from './ifthenpay-reference-adapter';
import type { PaymentReferenceFactory, PaymentReferenceResult } from './payment-reference-factory';
import type { SupabaseClientLike } from './pet-supabase';

type ShelterReferenceConfigRow = {
  active_provider: 'eupago' | 'ifthenpay' | null;
  eupago_api_key_encrypted: string | null;
  ifthenpay_api_key_encrypted: string | null;
  mb_way_phone: string | null;
};

const NOT_CONFIGURED: PaymentReferenceResult = { ok: false, reason: 'invalid_response' };

export const createSupabasePaymentReferenceFactory = ({
  client,
  encryptionSecret,
  fetch: fetchFn,
}: {
  client: SupabaseClientLike;
  encryptionSecret: string;
  fetch: typeof globalThis.fetch;
}): PaymentReferenceFactory => ({
  createReference: async (input) => {
    const { data, error } = await client
      .from('shelter_payment_configs')
      .select('active_provider,eupago_api_key_encrypted,ifthenpay_api_key_encrypted,mb_way_phone')
      .eq('shelter_id', input.shelterId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) return NOT_CONFIGURED;

    const row = data as ShelterReferenceConfigRow;

    if (row.active_provider === 'eupago') {
      if (!row.eupago_api_key_encrypted) return NOT_CONFIGURED;
      let apiKey: string;
      try {
        apiKey = await decryptCredential(row.eupago_api_key_encrypted, encryptionSecret);
      } catch {
        return NOT_CONFIGURED;
      }
      const adapter = createEupagoReferenceAdapter({
        apiKey,
        mbWayPhone: row.mb_way_phone ?? undefined,
        fetch: fetchFn,
      });
      return adapter.createReference(input);
    }

    if (row.active_provider === 'ifthenpay') {
      if (!row.ifthenpay_api_key_encrypted) return NOT_CONFIGURED;
      let apiKey: string;
      try {
        apiKey = await decryptCredential(row.ifthenpay_api_key_encrypted, encryptionSecret);
      } catch {
        return NOT_CONFIGURED;
      }
      const adapter = createIfthenpayReferenceAdapter({
        apiKey,
        mbWayPhone: row.mb_way_phone ?? undefined,
        fetch: fetchFn,
      });
      return adapter.createReference(input);
    }

    return NOT_CONFIGURED;
  },
});
