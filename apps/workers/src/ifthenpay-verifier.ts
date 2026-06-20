import { z } from 'zod';
import type { PaymentWebhookVerifier, ParsedWebhookEvent } from './payment-webhook';

const ifthenpayCallbackSchema = z
  .object({
    requestId: z.string().trim().min(1),
    orderId: z.string().trim().min(1),
    amount: z.string().trim().min(1),
    payment_datetime: z.string().trim().min(1),
    entity: z.string().trim().min(1).optional(),
    reference: z.string().trim().min(1).optional(),
  })
  .passthrough()
  .superRefine((payload, context) => {
    if ((payload.entity && !payload.reference) || (!payload.entity && payload.reference)) {
      context.addIssue({
        code: 'custom',
        path: ['reference'],
        message: 'entity and reference must be provided together',
      });
    }
  });

function timingSafeStringEqual(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;

  const maxLength = Math.max(actual.length, expected.length);
  let diff = actual.length ^ expected.length;

  for (let i = 0; i < maxLength; i++) {
    diff |= (actual.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }

  return diff === 0;
}

const queryParamsToSanitizedPayload = (params: URLSearchParams): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of params.entries()) {
    if (key !== 'key') payload[key] = value;
  }

  return payload;
};

export const createIfthenpayWebhookVerifier = (): PaymentWebhookVerifier =>
  async ({ requestUrl, secret }): Promise<ParsedWebhookEvent | null> => {
    let url: URL;
    try {
      url = new URL(requestUrl);
    } catch {
      return null;
    }

    const antiPhishingKey = url.searchParams.get('key');
    if (!antiPhishingKey || !timingSafeStringEqual(antiPhishingKey, secret)) return null;

    const payload = queryParamsToSanitizedPayload(url.searchParams);
    const parsed = ifthenpayCallbackSchema.safeParse(payload);
    if (!parsed.success) return null;

    return {
      providerEventId: `${parsed.data.requestId}:paid`,
      providerPaymentId: parsed.data.requestId,
      newStatus: 'paid',
      payload,
    };
  };
