import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  PaymentWebhookRepository,
  RecordWebhookEventInput,
  UpdateDonationStatusInput,
} from './payment-webhook';
import type { DonationProvider } from './donation';

export class SupabasePaymentWebhookRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabasePaymentWebhookRepositoryError';
  }
}

export type CreateSupabasePaymentWebhookRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabasePaymentWebhookRepositoriesResult = {
  paymentWebhookRepository: PaymentWebhookRepository;
};

export const createSupabasePaymentWebhookRepositories = ({
  client,
}: CreateSupabasePaymentWebhookRepositoriesInput): CreateSupabasePaymentWebhookRepositoriesResult => {
  const paymentWebhookRepository: PaymentWebhookRepository = {
    isEventAlreadyProcessed: async (
      providerEventId: string,
      provider: DonationProvider,
    ): Promise<boolean> => {
      const result = (await client
        .from('payment_webhook_events')
        .select('id')
        .eq('provider_event_id', providerEventId)
        .eq('provider', provider)
        .maybeSingle()) as SupabaseQueryResult<{ id: string } | null>;

      if (result.error) {
        throw new SupabasePaymentWebhookRepositoryError(
          `Failed to check webhook idempotency: ${result.error.message}`,
        );
      }

      return result.data !== null;
    },

    recordWebhookEvent: async (input: RecordWebhookEventInput): Promise<void> => {
      const row = {
        provider_event_id: input.providerEventId,
        provider: input.provider,
        payload: input.payload,
        received_at: input.receivedAt,
      };

      const result = (await client
        .from('payment_webhook_events')
        .insert(row)
        .select('id')
        .single()) as SupabaseQueryResult<{ id: string }>;

      if (result.error) {
        throw new SupabasePaymentWebhookRepositoryError(
          `Failed to record webhook event: ${result.error.message}`,
        );
      }
    },

    updateDonationStatus: async (input: UpdateDonationStatusInput): Promise<{ found: boolean }> => {
      const result = (await client
        .from('donation_transactions')
        .update({ status: input.newStatus, updated_at: input.providerEventId })
        .eq('provider_payment_id', input.providerPaymentId)
        .eq('provider', input.provider)
        .select('id')) as SupabaseQueryResult<Array<{ id: string }>>;

      if (result.error) {
        throw new SupabasePaymentWebhookRepositoryError(
          `Failed to update donation status: ${result.error.message}`,
        );
      }

      const rows = result.data ?? [];

      return { found: rows.length > 0 };
    },
  };

  return { paymentWebhookRepository };
};
