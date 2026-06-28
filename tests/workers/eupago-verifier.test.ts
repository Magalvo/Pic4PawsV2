import { describe, expect, it } from 'vitest';
import { createEupagoVerifier } from '../../apps/workers/src/eupago-verifier';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'eupago-test-secret-key-for-hmac';

const computeHmacHex = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const makeMbwayBody = (transactionId = 'txn-001') =>
  JSON.stringify({
    transactionId,
    value: '10.00',
    status: 'Success',
    date: '2026-06-28',
    method: 'MBW',
    alias: '+351912345678',
  });

const makeMultibancoBody = (transactionId = 'txn-002') =>
  JSON.stringify({
    transactionId,
    value: '25.00',
    status: 'Success',
    date: '2026-06-28',
    method: 'MB',
    entity: '11111',
    reference: '123456789',
  });

const makeCallParams = async (
  rawBody: string,
  secret = WEBHOOK_SECRET,
): Promise<Parameters<ReturnType<typeof createEupagoVerifier>>[0]> => ({
  rawBody,
  requestUrl: 'https://worker.test/webhooks/payments/eupago',
  signatureHeader: await computeHmacHex(rawBody, secret),
  secret,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createEupagoVerifier', () => {
  const verifier = createEupagoVerifier();

  it('MB WAY: valid HMAC + Success status → parsed event', async () => {
    const body = makeMbwayBody();
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.providerEventId).toBe('txn-001:paid');
    expect(result?.providerPaymentId).toBe('txn-001');
    expect(result?.newStatus).toBe('paid');
    expect(result?.payload['alias']).toBe('+351912345678');
  });

  it('Multibanco: valid HMAC + Success status → parsed event with entity/reference', async () => {
    const body = makeMultibancoBody();
    const params = await makeCallParams(body);
    const result = await verifier(params);
    expect(result).not.toBeNull();
    expect(result?.providerEventId).toBe('txn-002:paid');
    expect(result?.payload['entity']).toBe('11111');
    expect(result?.payload['reference']).toBe('123456789');
  });

  it('valid HMAC but non-Success status → null', async () => {
    const body = JSON.stringify({
      transactionId: 'txn-003',
      value: '5.00',
      status: 'Pending',
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
    const sig = await computeHmacHex(body, 'wrong-secret');
    const result = await verifier({
      rawBody: body,
      requestUrl: 'https://worker.test/webhooks/payments/eupago',
      signatureHeader: sig,
      secret: WEBHOOK_SECRET,
    });
    expect(result).toBeNull();
  });

  it('missing x-eupago-signature (signatureHeader=null) → null', async () => {
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
    const sig = await computeHmacHex(body, WEBHOOK_SECRET);
    const result = await verifier({
      rawBody: body,
      requestUrl: 'https://worker.test/webhooks/payments/eupago',
      signatureHeader: sig,
      secret: WEBHOOK_SECRET,
    });
    expect(result).toBeNull();
  });

  it('missing required body field (transactionId) → null', async () => {
    const body = JSON.stringify({
      value: '10.00',
      status: 'Success',
      date: '2026-06-28',
      method: 'MBW',
    });
    const sig = await computeHmacHex(body, WEBHOOK_SECRET);
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
