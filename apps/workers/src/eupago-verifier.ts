import { z } from 'zod';
import type { DonationWebhookStatus, PaymentWebhookVerifier, ParsedWebhookEvent } from './payment-webhook';

// Eupago Realtime Webhooks 2.0 — nested transactions object, base64 HMAC, X-Signature header
const eupagoTransactionSchema = z.object({
  transactionId: z.string().min(1),
  value: z.string().min(1),
  status: z.enum(['Paid', 'Refund', 'Error', 'Cancel', 'Expired']),
  date: z.string().min(1),
  method: z.string().min(1),
  alias: z.string().optional(),
  entity: z.string().optional(),
  reference: z.string().optional(),
});

const eupagoBodySchema = z.object({ transactions: eupagoTransactionSchema });

const STATUS_MAP: Record<
  z.infer<typeof eupagoTransactionSchema>['status'],
  DonationWebhookStatus
> = {
  Paid: 'paid',
  Refund: 'refunded',
  Cancel: 'cancelled',
  Error: 'failed',
  Expired: 'failed',
};

const verifyHmacSha256 = async (
  rawBody: string,
  secret: string,
  signatureBase64: string,
): Promise<boolean> => {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const sigBytes = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));
    return crypto.subtle.verify('HMAC', key, sigBytes.buffer as ArrayBuffer, new TextEncoder().encode(rawBody));
  } catch {
    return false;
  }
};

export const createEupagoVerifier = (): PaymentWebhookVerifier =>
  async ({ rawBody, signatureHeader, secret }): Promise<ParsedWebhookEvent | null> => {
    if (!signatureHeader || !secret) return null;

    let bodyObj: Record<string, unknown>;
    try {
      bodyObj = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }

    const parsed = eupagoBodySchema.safeParse(bodyObj);
    if (!parsed.success) return null;

    const valid = await verifyHmacSha256(rawBody, secret, signatureHeader);
    if (!valid) return null;

    const tx = parsed.data.transactions;
    const newStatus: DonationWebhookStatus = STATUS_MAP[tx.status];

    const payload: Record<string, unknown> = {
      value: tx.value,
      date: tx.date,
      method: tx.method,
    };
    if (tx.alias) payload.alias = tx.alias;
    if (tx.entity) payload.entity = tx.entity;
    if (tx.reference) payload.reference = tx.reference;

    return {
      providerEventId: `${tx.transactionId}:${tx.status.toLowerCase()}`,
      providerPaymentId: tx.transactionId,
      newStatus,
      payload,
    };
  };
