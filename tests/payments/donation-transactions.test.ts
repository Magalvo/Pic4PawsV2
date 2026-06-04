import { describe, expect, it } from 'vitest';
import {
  applyVerifiedPaymentWebhookEvent,
  createDonationTransaction,
  type DonationIntentInput,
  type DonationTransactionRecord,
} from '../../packages/payments/src/index';

const validIntent: DonationIntentInput = {
  kind: 'one_time_donation',
  provider: 'eupago',
  paymentMethod: 'mb_way',
  shelterId: 'shelter-a',
  petId: 'pet-a',
  donorUserId: 'donor-a',
  donorDisplayName: 'Ana',
  donorEmail: 'ana@example.test',
  amountCents: 1500,
  idempotencyKey: 'intent-abc',
  publicMessage: 'Forca Becas',
  anonymous: false,
};

describe('createDonationTransaction', () => {
  it('creates a safe pending payment transaction from a valid intent', () => {
    expect(
      createDonationTransaction({
        id: 'donation-a',
        providerPaymentId: 'psp-payment-a',
        intent: validIntent,
        now: '2026-06-04T12:00:00.000Z',
      }),
    ).toEqual({
      ok: true,
      transaction: {
        id: 'donation-a',
        kind: 'one_time_donation',
        status: 'pending_payment',
        provider: 'eupago',
        providerPaymentId: 'psp-payment-a',
        providerCustomerId: null,
        providerSubscriptionId: null,
        idempotencyKey: 'intent-abc',
        shelterId: 'shelter-a',
        petId: 'pet-a',
        donorUserId: 'donor-a',
        donorDisplayName: 'Ana',
        donorEmail: 'ana@example.test',
        amountCents: 1500,
        feeCents: null,
        netAmountCents: null,
        currency: 'EUR',
        paymentMethod: 'mb_way',
        paidAt: null,
        refundedAt: null,
        rawProviderEventIds: [],
        publicMessage: 'Forca Becas',
        anonymous: false,
        createdAt: '2026-06-04T12:00:00.000Z',
        updatedAt: '2026-06-04T12:00:00.000Z',
      },
    });
  });

  it('rejects invalid amounts and missing idempotency keys', () => {
    expect(
      createDonationTransaction({
        id: 'donation-a',
        providerPaymentId: 'psp-payment-a',
        intent: { ...validIntent, amountCents: 0, idempotencyKey: '' },
        now: '2026-06-04T12:00:00.000Z',
      }),
    ).toEqual({
      ok: false,
      reasons: ['invalid_amount_cents', 'missing_idempotency_key'],
    });
  });
});

describe('applyVerifiedPaymentWebhookEvent', () => {
  const pendingTransaction: DonationTransactionRecord = {
    id: 'donation-a',
    kind: 'one_time_donation',
    status: 'pending_payment',
    provider: 'eupago',
    providerPaymentId: 'psp-payment-a',
    providerCustomerId: null,
    providerSubscriptionId: null,
    idempotencyKey: 'intent-abc',
    shelterId: 'shelter-a',
    petId: 'pet-a',
    donorUserId: 'donor-a',
    donorDisplayName: 'Ana',
    donorEmail: 'ana@example.test',
    amountCents: 1500,
    feeCents: null,
    netAmountCents: null,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    paidAt: null,
    refundedAt: null,
    rawProviderEventIds: [],
    publicMessage: 'Forca Becas',
    anonymous: false,
    createdAt: '2026-06-04T12:00:00.000Z',
    updatedAt: '2026-06-04T12:00:00.000Z',
  };

  it('applies a verified paid webhook event once', () => {
    expect(
      applyVerifiedPaymentWebhookEvent({
        transaction: pendingTransaction,
        event: {
          provider: 'eupago',
          providerEventId: 'event-paid-1',
          providerPaymentId: 'psp-payment-a',
          verified: true,
          status: 'paid',
          occurredAt: '2026-06-04T12:10:00.000Z',
          feeCents: 30,
          netAmountCents: 1470,
        },
      }),
    ).toEqual({
      ok: true,
      applied: true,
      transaction: {
        ...pendingTransaction,
        status: 'paid',
        paidAt: '2026-06-04T12:10:00.000Z',
        feeCents: 30,
        netAmountCents: 1470,
        rawProviderEventIds: ['event-paid-1'],
        updatedAt: '2026-06-04T12:10:00.000Z',
      },
    });
  });

  it('does not reapply duplicate provider webhook events', () => {
    expect(
      applyVerifiedPaymentWebhookEvent({
        transaction: { ...pendingTransaction, rawProviderEventIds: ['event-paid-1'] },
        event: {
          provider: 'eupago',
          providerEventId: 'event-paid-1',
          providerPaymentId: 'psp-payment-a',
          verified: true,
          status: 'paid',
          occurredAt: '2026-06-04T12:10:00.000Z',
        },
      }),
    ).toEqual({
      ok: true,
      applied: false,
      transaction: { ...pendingTransaction, rawProviderEventIds: ['event-paid-1'] },
    });
  });

  it('rejects unverified or mismatched webhook events', () => {
    expect(
      applyVerifiedPaymentWebhookEvent({
        transaction: pendingTransaction,
        event: {
          provider: 'eupago',
          providerEventId: 'event-paid-1',
          providerPaymentId: 'psp-payment-a',
          verified: false,
          status: 'paid',
          occurredAt: '2026-06-04T12:10:00.000Z',
        },
      }),
    ).toEqual({ ok: false, reasons: ['event_not_verified'] });

    expect(
      applyVerifiedPaymentWebhookEvent({
        transaction: pendingTransaction,
        event: {
          provider: 'stripe',
          providerEventId: 'event-paid-2',
          providerPaymentId: 'psp-payment-a',
          verified: true,
          status: 'paid',
          occurredAt: '2026-06-04T12:10:00.000Z',
        },
      }),
    ).toEqual({ ok: false, reasons: ['provider_mismatch'] });
  });
});
