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
  signatureHeader: string | null;
  secret: string;
}) => ParsedWebhookEvent | null;

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

export type PaymentWebhookRepository = {
  isEventAlreadyProcessed: (
    providerEventId: string,
    provider: DonationProvider,
  ) => Promise<boolean>;
  recordWebhookEvent: (input: RecordWebhookEventInput) => Promise<void>;
  updateDonationStatus: (
    input: UpdateDonationStatusInput,
  ) => Promise<{ found: boolean }>;
};

export const PROVIDER_SIGNATURE_HEADERS: Record<DonationProvider, string> = {
  eupago: 'x-eupago-signature',
  ifthenpay: 'x-ifthenpay-signature',
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
  const signatureHeader = request.headers.get(PROVIDER_SIGNATURE_HEADERS[provider]);
  const parsed = paymentWebhookVerifier({ rawBody, signatureHeader, secret: webhookSecret });

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

  // 4. Idempotency check
  const alreadyProcessed = await paymentWebhookRepository.isEventAlreadyProcessed(
    parsed.providerEventId,
    provider,
  );

  if (alreadyProcessed) {
    return jsonResponse({ status: 'webhook_already_processed' }, { status: 200 });
  }

  // 5. Record webhook event
  await paymentWebhookRepository.recordWebhookEvent({
    providerEventId: parsed.providerEventId,
    provider,
    payload: parsed.payload,
    receivedAt: now,
  });

  // 6. Update donation status
  const { found } = await paymentWebhookRepository.updateDonationStatus({
    providerPaymentId: parsed.providerPaymentId,
    provider,
    newStatus: parsed.newStatus,
    providerEventId: parsed.providerEventId,
  });

  // 7. Dispatch notification for paid events (fire-and-forget)
  if (found && parsed.newStatus === 'paid' && notificationRepository) {
    notificationRepository
      .notifyDonationPaid({
        providerPaymentId: parsed.providerPaymentId,
        provider,
      })
      .catch(() => undefined);
  }

  return jsonResponse({ status: 'webhook_accepted', donationFound: found }, { status: 200 });
};
