import { describe, expect, it, vi } from 'vitest';
import { createEupagoReferenceAdapter } from '../../apps/workers/src/eupago-reference-adapter';
import type { PaymentReferenceInput } from '../../apps/workers/src/payment-reference-factory';

const baseInput: PaymentReferenceInput = {
  donationId: 'donation-001',
  amountCents: 1500,
  currency: 'EUR',
  shelterId: 'shelter-abc',
  orderId: 'order-uuid-001',
  paymentMethod: 'multibanco',
};

const makeFetch = (status: number, body: unknown): typeof fetch =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

const makeNetworkError = (): typeof fetch =>
  vi.fn().mockRejectedValue(new TypeError('fetch failed'));

const makeTimeoutFetch = (): typeof fetch =>
  vi.fn().mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));

// ─── Multibanco ───────────────────────────────────────────────────────────────

describe('createEupagoReferenceAdapter — paymentMethod: multibanco', () => {
  it('returns multibanco reference on successful response', async () => {
    const fetch = makeFetch(200, {
      transactionID: 'txn-mb-001',
      entity: '10611',
      reference: '123456789',
      expiryDate: '2026-07-01T00:00:00.000Z',
    });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key-abc', fetch });
    const result = await adapter.createReference(baseInput);

    expect(result).toEqual({
      ok: true,
      providerPaymentId: 'txn-mb-001',
      reference: {
        method: 'multibanco',
        entity: '10611',
        reference: '123456789',
        expiresAt: '2026-07-01T00:00:00.000Z',
      },
    });
  });

  it('uses multibanco endpoint when paymentMethod is multibanco', async () => {
    const fetch = makeFetch(200, {
      transactionID: 'txn-mb-002',
      entity: '10611',
      reference: '000000001',
      expiryDate: null,
    });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key-abc', fetch });
    await adapter.createReference(baseInput);

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown];
    expect(url).toContain('multibanco');
  });

  it('sends ApiKey auth header', async () => {
    const fetch = makeFetch(200, {
      transactionID: 'txn-mb-003',
      entity: '10611',
      reference: '000000002',
      expiryDate: null,
    });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'my-secret-key', fetch });
    await adapter.createReference(baseInput);

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get('Authorization')).toBe('ApiKey my-secret-key');
  });
});

// ─── MB WAY ───────────────────────────────────────────────────────────────────

const mbWayInput: PaymentReferenceInput = {
  ...baseInput,
  paymentMethod: 'mb_way',
  mbWayPhone: '+351910000001',
};

describe('createEupagoReferenceAdapter — paymentMethod: mb_way', () => {
  it('returns mb_way reference on successful response', async () => {
    const fetch = makeFetch(200, {
      transactionID: 'txn-mbway-001',
      alias: '+351910000001',
      expiryDate: '2026-07-01T00:00:00.000Z',
    });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key-abc', fetch });
    const result = await adapter.createReference(mbWayInput);

    expect(result).toEqual({
      ok: true,
      providerPaymentId: 'txn-mbway-001',
      reference: {
        method: 'mb_way',
        phone: '+351910000001',
        expiresAt: '2026-07-01T00:00:00.000Z',
      },
    });
  });

  it('uses mbway endpoint when paymentMethod is mb_way', async () => {
    const fetch = makeFetch(200, {
      transactionID: 'txn-mbway-002',
      alias: '+351910000001',
      expiryDate: null,
    });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key-abc', fetch });
    await adapter.createReference(mbWayInput);

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown];
    expect(url).toContain('mbway');
  });
});

// ─── Error paths ──────────────────────────────────────────────────────────────

describe('createEupagoReferenceAdapter — error paths', () => {
  it('PSP HTTP 4xx → { ok: false, reason: "psp_error" }', async () => {
    const fetch = makeFetch(400, { error: 'Bad Request' });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key', fetch });
    const result = await adapter.createReference(baseInput);

    expect(result).toEqual({ ok: false, reason: 'psp_error' });
  });

  it('PSP HTTP 5xx → { ok: false, reason: "psp_error" }', async () => {
    const fetch = makeFetch(503, { error: 'Service Unavailable' });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key', fetch });
    const result = await adapter.createReference(baseInput);

    expect(result).toEqual({ ok: false, reason: 'psp_error' });
  });

  it('network error → { ok: false, reason: "psp_timeout" }', async () => {
    const adapter = createEupagoReferenceAdapter({ apiKey: 'key', fetch: makeNetworkError() });
    const result = await adapter.createReference(baseInput);

    expect(result).toEqual({ ok: false, reason: 'psp_timeout' });
  });

  it('AbortError (timeout) → { ok: false, reason: "psp_timeout" }', async () => {
    const adapter = createEupagoReferenceAdapter({ apiKey: 'key', fetch: makeTimeoutFetch() });
    const result = await adapter.createReference(baseInput);

    expect(result).toEqual({ ok: false, reason: 'psp_timeout' });
  });

  it('malformed PSP response (missing transactionID) → { ok: false, reason: "invalid_response" }', async () => {
    const fetch = makeFetch(200, { entity: '10611', reference: '123456789' });

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key', fetch });
    const result = await adapter.createReference(baseInput);

    expect(result).toEqual({ ok: false, reason: 'invalid_response' });
  });

  it('non-JSON PSP response → { ok: false, reason: "invalid_response" }', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('not json', { status: 200 })) as typeof globalThis.fetch;

    const adapter = createEupagoReferenceAdapter({ apiKey: 'key', fetch });
    const result = await adapter.createReference(baseInput);

    expect(result).toEqual({ ok: false, reason: 'invalid_response' });
  });
});
