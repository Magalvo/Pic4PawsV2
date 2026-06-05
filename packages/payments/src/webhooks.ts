import type { PaymentProvider } from '@pic4paws/domain';
import type { DonationStatus, DonationTransactionRecord } from './donations';

export type PaymentWebhookStatus = Extract<
  DonationStatus,
  'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'
>;

export type VerifiedPaymentWebhookEvent = {
  provider: PaymentProvider;
  providerEventId: string;
  providerPaymentId: string;
  verified: boolean;
  status: PaymentWebhookStatus;
  occurredAt: string;
  feeCents?: number | null;
  netAmountCents?: number | null;
};

export type PaymentWebhookRejectionReason =
  | 'event_not_verified'
  | 'provider_mismatch'
  | 'provider_payment_mismatch'
  | 'missing_provider_event_id';

export type ApplyPaymentWebhookInput = {
  transaction: DonationTransactionRecord;
  event: VerifiedPaymentWebhookEvent;
};

export type ApplyPaymentWebhookResult =
  | { ok: true; applied: true; transaction: DonationTransactionRecord }
  | { ok: true; applied: false; transaction: DonationTransactionRecord }
  | { ok: false; reasons: PaymentWebhookRejectionReason[] };

const terminalRefundStatuses: PaymentWebhookStatus[] = ['refunded', 'partially_refunded'];

export const applyVerifiedPaymentWebhookEvent = ({
  transaction,
  event,
}: ApplyPaymentWebhookInput): ApplyPaymentWebhookResult => {
  const reasons: PaymentWebhookRejectionReason[] = [];

  if (!event.verified) {
    reasons.push('event_not_verified');
  }

  if (transaction.provider !== event.provider) {
    reasons.push('provider_mismatch');
  }

  if (transaction.providerPaymentId !== event.providerPaymentId) {
    reasons.push('provider_payment_mismatch');
  }

  if (event.providerEventId.trim().length === 0) {
    reasons.push('missing_provider_event_id');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  if (transaction.rawProviderEventIds.includes(event.providerEventId)) {
    return { ok: true, applied: false, transaction };
  }

  const refundedAt = terminalRefundStatuses.includes(event.status) ? event.occurredAt : transaction.refundedAt;

  return {
    ok: true,
    applied: true,
    transaction: {
      ...transaction,
      status: event.status,
      paidAt: event.status === 'paid' ? event.occurredAt : transaction.paidAt,
      refundedAt,
      feeCents: event.feeCents ?? transaction.feeCents,
      netAmountCents: event.netAmountCents ?? transaction.netAmountCents,
      rawProviderEventIds: [...transaction.rawProviderEventIds, event.providerEventId],
      updatedAt: event.occurredAt,
    },
  };
};
