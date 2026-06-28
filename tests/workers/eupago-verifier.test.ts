import { describe, expect, it } from 'vitest';
import { createEupagoVerifier } from '../../apps/workers/src/eupago-verifier';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'eupago-test-secret-key-for-hmac';

// Eupago Realtime Webhooks 2.0 — base64-encoded HMAC-SHA256, X-Signature header
const computeHmacBase64 = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
};

const makeMbwayBody = (transactionId = 'txn-001', status = 'Paid') =>
  JSON.stringify({
    transactions: {
      transactionId,
      value: '10.00',
      status,
      date: '2026-06-28',
      method: 'MBW',
      alias: '+351912345678',
    },
  });

const makeMultibancoBody = (transactionId = 'txn-002', status = 'Paid') =>
  JSON.stringify({
    transactions: {
      transactionId,
      value: '25.00',
      status,
      date: '2026-06-28',
      method: 'MB',
      entity: '11111',
      reference: '123456789',
    },
  });

const makeCallParams = async (
  rawBody: string,
  secret = WEBHOOK_SECRET,
): Promise<Parameters<ReturnType<typeof createEupagoVerifier>>[0]> => ({
  rawBody,
  requestUrl: 'https://worker.test/webhooks/payments/eupago',
  signatureHeader: await computeHmacBase64(rawBody, secret),
  secret,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createEupagoVerifier', () => {
  const verifier = createEupagoVerifier();

  it('MB WAY: valid base64 HMAC + Paid status → parsed event', async () => {
    const body = makeMbwayBody();
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.providerEventId).toBe('txn-001:paid');
    expect(result?.providerPaymentId).toBe('txn-001');
    expect(result?.newStatus).toBe('paid');
    expect(result?.payload['alias']).toBe('+351912345678');
  });

  it('Multibanco: valid base64 HMAC + Paid status → parsed event with entity/reference', async () => {
    const body = makeMultibancoBody();
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.providerEventId).toBe('txn-002:paid');
    expect(result?.payload['entity']).toBe('11111');
    expect(result?.payload['reference']).toBe('123456789');
  });

  it('Refund status → newStatus refunded', async () => {
    const body = makeMbwayBody('txn-001', 'Refund');
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.newStatus).toBe('refunded');
    expect(result?.providerEventId).toBe('txn-001:refund');
  });

  it('Cancel status → newStatus cancelled', async () => {
    const body = makeMbwayBody('txn-001', 'Cancel');
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.newStatus).toBe('cancelled');
    expect(result?.providerEventId).toBe('txn-001:cancel');
  });

  it('Error status → newStatus failed', async () => {
    const body = makeMbwayBody('txn-001', 'Error');
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.newStatus).toBe('failed');
    expect(result?.providerEventId).toBe('txn-001:error');
  });

  it('Expired status → newStatus failed', async () => {
    const body = makeMbwayBody('txn-001', 'Expired');
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.newStatus).toBe('failed');
    expect(result?.providerEventId).toBe('txn-001:expired');
  });

  it('unknown status value (not in enum) → null', async () => {
    const body = JSON.stringify({
      transactions: {
        transactionId: 'txn-003',
        value: '5.00',
        status: 'Pending',
        date: '2026-06-28',
        method: 'MBW',
      },
    });
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).toBeNull();
  });

  it('flat body (legacy Webhooks 1.x format) → null (schema mismatch)', async () => {
    const body = JSON.stringify({
      transactionId: 'txn-004',
      value: '10.00',
      status: 'Success',
      date: '2026-06-28',
      method: 'MBW',
    });
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).toBeNull();
  });

  it('tampered body → null', async () => {
    const body = makeMbwayBody();
    const params = await makeCallParams(body);
    const result = await verifier({
      ...params,
      rawBody: body.replace('"10.00"', '"99.00"'),
    });
    expect(result).toBeNull();
  });

  it('wrong secret → null', async () => {
    const body = makeMbwayBody();
    const sig = await computeHmacBase64(body, 'wrong-secret');
    const result = await verifier({
      rawBody: body,
      requestUrl: 'https://worker.test/webhooks/payments/eupago',
      signatureHeader: sig,
      secret: WEBHOOK_SECRET,
    });
    expect(result).toBeNull();
  });

  it('missing X-Signature (signatureHeader=null) → null', async () => {
    const body = makeMbwayBody();
    const result = await verifier({
      rawBody: body,
      requestUrl: 'https://worker.test/webhooks/payments/eupago',
      signatureHeader: null,
      secret: WEBHOOK_SECRET,
    });
    expect(result).toBeNull();
  });

  it('invalid JSON body → null', async () => {
    const body = 'not-json';
    const sig = await computeHmacBase64(body, WEBHOOK_SECRET);
    const result = await verifier({
      rawBody: body,
      requestUrl: 'https://worker.test/webhooks/payments/eupago',
      signatureHeader: sig,
      secret: WEBHOOK_SECRET,
    });
    expect(result).toBeNull();
  });

  it('missing required field (transactionId) inside transactions → null', async () => {
    const body = JSON.stringify({
      transactions: {
        value: '10.00',
        status: 'Paid',
        date: '2026-06-28',
        method: 'MBW',
      },
    });
    const sig = await computeHmacBase64(body, WEBHOOK_SECRET);
    const result = await verifier({
      rawBody: body,
      requestUrl: 'https://worker.test/webhooks/payments/eupago',
      signatureHeader: sig,
      secret: WEBHOOK_SECRET,
    });
    expect(result).toBeNull();
  });

  it('payload does not include transactionId (security: not persisted)', async () => {
    const body = makeMbwayBody('txn-safe');
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.payload['transactionId']).toBeUndefined();
  });
});
