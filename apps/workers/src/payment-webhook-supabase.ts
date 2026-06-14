import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  PaymentWebhookRepository,
  PaymentWebhookProcessingResult,
  ProcessVerifiedWebhookEventInput,
} from './payment-webhook';

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
    processVerifiedWebhookEvent: async (
      input: ProcessVerifiedWebhookEventInput,
    ): Promise<PaymentWebhookProcessingResult> => {
      const result = (await client.rpc('process_payment_webhook_event', {
        p_provider_event_id: input.providerEventId,
        p_provider: input.provider,
        p_provider_payment_id: input.providerPaymentId,
        p_new_status: input.newStatus,
        p_payload: input.payload,
        p_received_at: input.receivedAt,
      })) as SupabaseQueryResult<{
        already_processed: boolean;
        donation_found: boolean;
        previous_status: PaymentWebhookProcessingResult['previousStatus'];
        new_status: PaymentWebhookProcessingResult['newStatus'];
        processed_at: string | null;
        financial_timestamp: string | null;
        raw_provider_event_ids: string[] | null;
      }>;

      if (result.error || !result.data) {
        throw new SupabasePaymentWebhookRepositoryError(
          'Failed to process payment webhook event',
        );
      }

      return {
        alreadyProcessed: result.data.already_processed,
        donationFound: result.data.donation_found,
        previousStatus: result.data.previous_status,
        newStatus: result.data.new_status,
        processedAt: result.data.processed_at,
        financialTimestamp: result.data.financial_timestamp,
        rawProviderEventIds: result.data.raw_provider_event_ids ?? [],
      };
    },
  };

  return { paymentWebhookRepository };
};
