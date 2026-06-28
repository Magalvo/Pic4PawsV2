import type { DonationProvider } from './donation';
import type { DonationStatus } from './donation-list';
import type { NotificationRepository } from './notification';

export type DonationWebhookStatus = Extract<
  DonationStatus,
  'paid' | 'failed' | 'pending_payment' | 'cancelled' | 'refunded'
>;

export type ParsedWebhookEvent = {
  providerEventId: string;
  providerPaymentId: string;
  newStatus: DonationWebhookStatus;
  payload: Record<string, unknown>;
};

export type PaymentWebhookVerifier = (params: {
  rawBody: string;
  requestUrl: string;
  signatureHeader: string | null;
  secret: string;
}) => Promise<ParsedWebhookEvent | null>;

export type RecordWebhookEventInput = {
  providerEventId: string;
  provider: DonationProvider;
  payload: Record<string, unknown>;
  receivedAt: string;
};

export type UpdateDonationStatusInput = {
  providerPaymentId: string;
  provider: DonationProvider;
  newStatus: DonationWebhookStatus;
  providerEventId: string;
};

export type ProcessVerifiedWebhookEventInput = RecordWebhookEventInput & {
  providerPaymentId: string;
  newStatus: DonationWebhookStatus;
};

export type PaymentWebhookProcessingResult = {
  alreadyProcessed: boolean;
  donationFound: boolean;
  previousStatus: DonationStatus | null;
  newStatus: DonationWebhookStatus;
  processedAt: string | null;
  financialTimestamp: string | null;
  rawProviderEventIds: string[];
};

export type PaymentWebhookRepository = {
  processVerifiedWebhookEvent: (
    input: ProcessVerifiedWebhookEventInput,
  ) => Promise<PaymentWebhookProcessingResult>;
};

export const PROVIDER_SIGNATURE_HEADERS: Record<DonationProvider, string | null> = {
  eupago: 'X-Signature',
  ifthenpay: null,
  stripe: 'stripe-signature',
};

export type HandleWorkerPaymentWebhookRequestInput = {
  request: Request;
  rawBody: string;
  provider: DonationProvider;
  webhookSecret: string;
  paymentWebhookVerifier?: PaymentWebhookVerifier;
  paymentWebhookRepository?: PaymentWebhookRepository;
  notificationRepository?: NotificationRepository;
  now: string;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export const handleWorkerPaymentWebhookRequest = async ({
  request,
  rawBody,
  provider,
  webhookSecret,
  paymentWebhookVerifier,
  paymentWebhookRepository,
  notificationRepository,
  now,
}: HandleWorkerPaymentWebhookRequestInput): Promise<Response> => {
  // 1. Verifier configured
  if (!paymentWebhookVerifier) {
    return jsonResponse(
      { status: 'payment_webhook_verifier_not_configured', provider },
      { status: 501 },
    );
  }

  // 2. Verify and parse event
  const signatureHeaderName = PROVIDER_SIGNATURE_HEADERS[provider];
  const signatureHeader = signatureHeaderName ? request.headers.get(signatureHeaderName) : null;
  const parsed = await paymentWebhookVerifier({
    rawBody,
    requestUrl: request.url,
    signatureHeader,
    secret: webhookSecret,
  });

  if (!parsed) {
    return jsonResponse({ status: 'webhook_signature_invalid' }, { status: 401 });
  }

  // 3. Repository configured
  if (!paymentWebhookRepository) {
    return jsonResponse(
      { status: 'payment_webhook_repository_not_configured' },
      { status: 501 },
    );
  }

  let processingResult: PaymentWebhookProcessingResult;

  try {
    processingResult = await paymentWebhookRepository.processVerifiedWebhookEvent({
      providerEventId: parsed.providerEventId,
      provider,
      providerPaymentId: parsed.providerPaymentId,
      newStatus: parsed.newStatus,
      payload: parsed.payload,
      receivedAt: now,
    });
  } catch {
    return jsonResponse({ status: 'webhook_processing_failed' }, { status: 502 });
  }

  if (processingResult.alreadyProcessed) {
    return jsonResponse({ status: 'webhook_already_processed' }, { status: 200 });
  }

  // Dispatch notification for paid events (fire-and-forget).
  if (processingResult.donationFound && parsed.newStatus === 'paid' && notificationRepository) {
    notificationRepository
      .notifyDonationPaid({
        providerPaymentId: parsed.providerPaymentId,
        provider,
      })
      .catch(() => undefined);
  }

  return jsonResponse(
    { status: 'webhook_accepted', donationFound: processingResult.donationFound },
    { status: 200 },
  );
};
