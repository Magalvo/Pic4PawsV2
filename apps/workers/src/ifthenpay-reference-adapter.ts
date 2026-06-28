import type {
  PaymentReference,
  PaymentReferenceFactory,
  PaymentReferenceInput,
  PaymentReferenceResult,
} from './payment-reference-factory';

const IFTHENPAY_BASE = 'https://api.ifthenpay.com';

export type CreateIfthenpayReferenceAdapterInput = {
  apiKey: string;
  mbWayPhone?: string | null;
  fetch: typeof globalThis.fetch;
};

const amountValue = (amountCents: number): string =>
  (Math.round(amountCents) / 100).toFixed(2);

const parseMultibanco = (body: Record<string, unknown>): PaymentReferenceResult => {
  const requestId = body['RequestId'];
  const entity = body['Entity'];
  const reference = body['Reference'];
  if (
    typeof requestId !== 'string' ||
    typeof entity !== 'string' ||
    typeof reference !== 'string'
  ) {
    return { ok: false, reason: 'invalid_response' };
  }
  const expiresAt =
    typeof body['ExpiryDate'] === 'string' ? body['ExpiryDate'] : null;
  const ref: PaymentReference = { method: 'multibanco', entity, reference, expiresAt };
  return { ok: true, reference: ref, providerPaymentId: requestId };
};

const parseMbWay = (body: Record<string, unknown>): PaymentReferenceResult => {
  const requestId = body['RequestId'];
  const phone = body['Phone'];
  if (typeof requestId !== 'string' || typeof phone !== 'string') {
    return { ok: false, reason: 'invalid_response' };
  }
  const expiresAt =
    typeof body['ExpiryDate'] === 'string' ? body['ExpiryDate'] : null;
  const ref: PaymentReference = { method: 'mb_way', phone, expiresAt };
  return { ok: true, reference: ref, providerPaymentId: requestId };
};

const callIfthenpay = async (
  url: string,
  body: Record<string, unknown>,
  apiKey: string,
  fetchFn: typeof globalThis.fetch,
  parseBody: (b: Record<string, unknown>) => PaymentReferenceResult,
): Promise<PaymentReferenceResult> => {
  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: 'psp_timeout' };
  }

  if (!response.ok) {
    return { ok: false, reason: 'psp_error' };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: 'invalid_response' };
  }

  return parseBody(parsed);
};

export const createIfthenpayReferenceAdapter = ({
  apiKey,
  mbWayPhone,
  fetch: fetchFn,
}: CreateIfthenpayReferenceAdapterInput): PaymentReferenceFactory => ({
  createReference: (input: PaymentReferenceInput): Promise<PaymentReferenceResult> => {
    if (mbWayPhone) {
      return callIfthenpay(
        `${IFTHENPAY_BASE}/spg/payment/mbway`,
        {
          OrderId: input.orderId,
          Amount: amountValue(input.amountCents),
          MobilePhone: mbWayPhone,
          Currency: input.currency,
        },
        apiKey,
        fetchFn,
        parseMbWay,
      );
    }

    return callIfthenpay(
      `${IFTHENPAY_BASE}/ifthenpay/multibanco`,
      {
        OrderId: input.orderId,
        Amount: amountValue(input.amountCents),
        Currency: input.currency,
      },
      apiKey,
      fetchFn,
      parseMultibanco,
    );
  },
});
