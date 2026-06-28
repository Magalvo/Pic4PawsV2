import type {
  PaymentReference,
  PaymentReferenceFactory,
  PaymentReferenceInput,
  PaymentReferenceResult,
} from './payment-reference-factory';

const EUPAGO_BASE = 'https://clientes.eupago.pt/api/v1.02';

export type CreateEupagoReferenceAdapterInput = {
  apiKey: string;
  mbWayPhone?: string | null;
  fetch: typeof globalThis.fetch;
};

const amountValue = (amountCents: number): number =>
  Math.round(amountCents) / 100;

const parseMultibanco = (body: Record<string, unknown>): PaymentReferenceResult => {
  const transactionID = body['transactionID'];
  const entity = body['entity'];
  const reference = body['reference'];
  if (
    typeof transactionID !== 'string' ||
    typeof entity !== 'string' ||
    typeof reference !== 'string'
  ) {
    return { ok: false, reason: 'invalid_response' };
  }
  const expiresAt =
    typeof body['expiryDate'] === 'string' ? body['expiryDate'] : null;
  const ref: PaymentReference = { method: 'multibanco', entity, reference, expiresAt };
  return { ok: true, reference: ref, providerPaymentId: transactionID };
};

const parseMbWay = (body: Record<string, unknown>): PaymentReferenceResult => {
  const transactionID = body['transactionID'];
  const alias = body['alias'];
  if (typeof transactionID !== 'string' || typeof alias !== 'string') {
    return { ok: false, reason: 'invalid_response' };
  }
  const expiresAt =
    typeof body['expiryDate'] === 'string' ? body['expiryDate'] : null;
  const ref: PaymentReference = { method: 'mb_way', phone: alias, expiresAt };
  return { ok: true, reference: ref, providerPaymentId: transactionID };
};

const callEupago = async (
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
        Authorization: `ApiKey ${apiKey}`,
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

const createMultibancoReference = (
  input: PaymentReferenceInput,
  apiKey: string,
  fetchFn: typeof globalThis.fetch,
): Promise<PaymentReferenceResult> =>
  callEupago(
    `${EUPAGO_BASE}/multibanco/create`,
    {
      payment: {
        amount: { currency: input.currency, value: amountValue(input.amountCents) },
        identifier: input.orderId,
      },
    },
    apiKey,
    fetchFn,
    parseMultibanco,
  );

const createMbWayReference = (
  input: PaymentReferenceInput,
  phone: string,
  apiKey: string,
  fetchFn: typeof globalThis.fetch,
): Promise<PaymentReferenceResult> =>
  callEupago(
    `${EUPAGO_BASE}/mbway/create`,
    {
      payment: {
        amount: { currency: input.currency, value: amountValue(input.amountCents) },
        identifier: input.orderId,
        phone,
      },
    },
    apiKey,
    fetchFn,
    parseMbWay,
  );

export const createEupagoReferenceAdapter = ({
  apiKey,
  mbWayPhone,
  fetch: fetchFn,
}: CreateEupagoReferenceAdapterInput): PaymentReferenceFactory => ({
  createReference: (input: PaymentReferenceInput): Promise<PaymentReferenceResult> =>
    mbWayPhone
      ? createMbWayReference(input, mbWayPhone, apiKey, fetchFn)
      : createMultibancoReference(input, apiKey, fetchFn),
});
