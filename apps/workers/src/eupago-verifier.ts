import { z } from 'zod';
import type { PaymentWebhookVerifier, ParsedWebhookEvent } from './payment-webhook';

const eupagoBodySchema = z
  .object({
    transactionId: z.string().min(1),
    value: z.string().min(1),
    status: z.string().min(1),
    date: z.string().min(1),
    method: z.string().min(1),
    alias: z.string().optional(),
    entity: z.string().optional(),
    reference: z.string().optional(),
  })
  .passthrough();

const verifyHmacSha256 = async (
  rawBody: string,
  secret: string,
  signatureHex: string,
): Promise<boolean> => {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const sigBytes = Uint8Array.from(
      (signatureHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
    );
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

    if (parsed.data.status !== 'Success') return null;

    const valid = await verifyHmacSha256(rawBody, secret, signatureHeader);
    if (!valid) return null;

    const payload: Record<string, unknown> = {
      value: parsed.data.value,
      date: parsed.data.date,
      method: parsed.data.method,
    };
    if (parsed.data.alias) payload.alias = parsed.data.alias;
    if (parsed.data.entity) payload.entity = parsed.data.entity;
    if (parsed.data.reference) payload.reference = parsed.data.reference;

    return {
      providerEventId: `${parsed.data.transactionId}:paid`,
      providerPaymentId: parsed.data.transactionId,
      newStatus: 'paid',
      payload,
    };
  };
