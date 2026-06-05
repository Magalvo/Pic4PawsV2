import type { CurrencyCode, PaymentProvider } from '@pic4paws/domain';

export type DonationKind = 'one_time_donation' | 'monthly_sponsorship';

export type PaymentMethod = 'mb_way' | 'multibanco' | 'card' | 'bank_transfer' | 'unknown';

export type DonationStatus =
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type DonationIntentInput = {
  kind: DonationKind;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  shelterId: string;
  petId?: string | null;
  donorUserId?: string | null;
  donorDisplayName?: string | null;
  donorEmail?: string | null;
  amountCents: number;
  idempotencyKey: string;
  publicMessage?: string | null;
  anonymous: boolean;
};

export type DonationTransactionRecord = {
  id: string;
  kind: DonationKind;
  status: DonationStatus;
  provider: PaymentProvider;
  providerPaymentId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  idempotencyKey: string;
  shelterId: string;
  petId: string | null;
  donorUserId: string | null;
  donorDisplayName: string | null;
  donorEmail: string | null;
  amountCents: number;
  feeCents: number | null;
  netAmountCents: number | null;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  refundedAt: string | null;
  rawProviderEventIds: string[];
  publicMessage: string | null;
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DonationIntentValidationReason =
  | 'invalid_amount_cents'
  | 'missing_idempotency_key'
  | 'missing_shelter_id'
  | 'missing_provider_payment_id';

export type CreateDonationTransactionInput = {
  id: string;
  providerPaymentId: string;
  intent: DonationIntentInput;
  now: string;
};

export type CreateDonationTransactionResult =
  | { ok: true; transaction: DonationTransactionRecord }
  | { ok: false; reasons: DonationIntentValidationReason[] };

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const createDonationTransaction = ({
  id,
  providerPaymentId,
  intent,
  now,
}: CreateDonationTransactionInput): CreateDonationTransactionResult => {
  const reasons: DonationIntentValidationReason[] = [];

  if (!Number.isInteger(intent.amountCents) || intent.amountCents <= 0) {
    reasons.push('invalid_amount_cents');
  }

  if (!hasText(intent.idempotencyKey)) {
    reasons.push('missing_idempotency_key');
  }

  if (!hasText(intent.shelterId)) {
    reasons.push('missing_shelter_id');
  }

  if (!hasText(providerPaymentId)) {
    reasons.push('missing_provider_payment_id');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    transaction: {
      id,
      kind: intent.kind,
      status: 'pending_payment',
      provider: intent.provider,
      providerPaymentId,
      providerCustomerId: null,
      providerSubscriptionId: null,
      idempotencyKey: intent.idempotencyKey,
      shelterId: intent.shelterId,
      petId: intent.petId ?? null,
      donorUserId: intent.donorUserId ?? null,
      donorDisplayName: intent.donorDisplayName ?? null,
      donorEmail: intent.donorEmail ?? null,
      amountCents: intent.amountCents,
      feeCents: null,
      netAmountCents: null,
      currency: 'EUR',
      paymentMethod: intent.paymentMethod,
      paidAt: null,
      refundedAt: null,
      rawProviderEventIds: [],
      publicMessage: intent.publicMessage ?? null,
      anonymous: intent.anonymous,
      createdAt: now,
      updatedAt: now,
    },
  };
};
