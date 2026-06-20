import { describe, it, expect } from 'vitest';
import { createIfthenpayWebhookVerifier } from '../../apps/workers/src/ifthenpay-verifier';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SECRET = 'test-ifthenpay-secret';

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const paidPayload = JSON.stringify({
  requestId: 'REQ-001',
  estado: '000',
  valor: '10.00',
  dataHora: '2026-06-20 12:00:00',
});

const cancelledPayload = JSON.stringify({
  requestId: 'REQ-002',
  estado: '020',
  valor: '5.00',
  dataHora: '2026-06-20 12:01:00',
});

const failedPayload = JSON.stringify({
  requestId: 'REQ-003',
  estado: '099',
  valor: '20.00',
  dataHora: '2026-06-20 12:02:00',
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createIfthenpayWebhookVerifier', () => {
  it('returns null when signatureHeader is null', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const result = await verifier({ rawBody: paidPayload, signatureHeader: null, secret: SECRET });
    expect(result).toBeNull();
  });

  it('returns null when signatureHeader is empty string', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const result = await verifier({ rawBody: paidPayload, signatureHeader: '', secret: SECRET });
    expect(result).toBeNull();
  });

  it('returns null when HMAC does not match', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const result = await verifier({
      rawBody: paidPayload,
      signatureHeader: 'bad-signature',
      secret: SECRET,
    });
    expect(result).toBeNull();
  });

  it('returns null when signature matches wrong secret', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const wrongSig = await hmacHex('wrong-secret', paidPayload);
    const result = await verifier({ rawBody: paidPayload, signatureHeader: wrongSig, secret: SECRET });
    expect(result).toBeNull();
  });

  it('parses paid event (estado "000") correctly', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const sig = await hmacHex(SECRET, paidPayload);
    const result = await verifier({ rawBody: paidPayload, signatureHeader: sig, secret: SECRET });
    expect(result).not.toBeNull();
    expect(result?.newStatus).toBe('paid');
    expect(result?.providerPaymentId).toBe('REQ-001');
    expect(result?.providerEventId).toBe('REQ-001:000');
    expect(result?.payload).toMatchObject({ requestId: 'REQ-001', estado: '000' });
  });

  it('parses cancelled event (estado "020") correctly', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const sig = await hmacHex(SECRET, cancelledPayload);
    const result = await verifier({ rawBody: cancelledPayload, signatureHeader: sig, secret: SECRET });
    expect(result).not.toBeNull();
    expect(result?.newStatus).toBe('cancelled');
    expect(result?.providerPaymentId).toBe('REQ-002');
    expect(result?.providerEventId).toBe('REQ-002:020');
  });

  it('parses unknown estado as failed', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const sig = await hmacHex(SECRET, failedPayload);
    const result = await verifier({ rawBody: failedPayload, signatureHeader: sig, secret: SECRET });
    expect(result).not.toBeNull();
    expect(result?.newStatus).toBe('failed');
    expect(result?.providerEventId).toBe('REQ-003:099');
  });

  it('returns null when payload is not valid JSON', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const bad = 'not-json';
    const sig = await hmacHex(SECRET, bad);
    const result = await verifier({ rawBody: bad, signatureHeader: sig, secret: SECRET });
    expect(result).toBeNull();
  });

  it('returns null when requestId is missing from payload', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const body = JSON.stringify({ estado: '000', valor: '10.00', dataHora: '2026-06-20 12:00:00' });
    const sig = await hmacHex(SECRET, body);
    const result = await verifier({ rawBody: body, signatureHeader: sig, secret: SECRET });
    expect(result).toBeNull();
  });

  it('returns null when estado is missing from payload', async () => {
    const verifier = createIfthenpayWebhookVerifier();
    const body = JSON.stringify({ requestId: 'REQ-001', valor: '10.00', dataHora: '2026-06-20 12:00:00' });
    const sig = await hmacHex(SECRET, body);
    const result = await verifier({ rawBody: body, signatureHeader: sig, secret: SECRET });
    expect(result).toBeNull();
  });

  it('createIfthenpayWebhookVerifier returns a new function on each call', () => {
    const v1 = createIfthenpayWebhookVerifier();
    const v2 = createIfthenpayWebhookVerifier();
    expect(v1).not.toBe(v2);
  });
});
