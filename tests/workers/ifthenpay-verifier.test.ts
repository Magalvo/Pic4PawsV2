import { describe, expect, it } from 'vitest';
import { createIfthenpayWebhookVerifier } from '../../apps/workers/src/ifthenpay-verifier';

const SECRET = 'test-anti-phishing-key';
const BASE_URL = 'https://worker.example.com/webhooks/payments';

const mbWayCallbackUrl =
  `${BASE_URL}?key=${SECRET}` +
  '&orderId=1887' +
  '&amount=33.61' +
  '&requestId=i2szvoUfPYBMWdSxqO3n' +
  '&payment_datetime=03-01-2024%2015%3A15%3A16';

const multibancoCallbackUrl =
  `${BASE_URL}?key=${SECRET}` +
  '&orderId=order-1234' +
  '&amount=1234.56' +
  '&requestId=5Qd8gtWLAEUJ6n0lkS5g' +
  '&entity=99999' +
  '&reference=123456789' +
  '&payment_datetime=28-10-2021%2010%3A55%3A21';

const verify = (requestUrl: string, secret = SECRET) =>
  createIfthenpayWebhookVerifier()({
    rawBody: '',
    requestUrl,
    signatureHeader: null,
    secret,
  });

describe('createIfthenpayWebhookVerifier', () => {
  it('accepts an official-style MB WAY callback URL as a paid event', async () => {
    const result = await verify(mbWayCallbackUrl);

    expect(result).toEqual({
      providerEventId: 'i2szvoUfPYBMWdSxqO3n:paid',
      providerPaymentId: 'i2szvoUfPYBMWdSxqO3n',
      newStatus: 'paid',
      payload: {
        orderId: '1887',
        amount: '33.61',
        requestId: 'i2szvoUfPYBMWdSxqO3n',
        payment_datetime: '03-01-2024 15:15:16',
      },
    });
  });

  it('accepts an official-style Multibanco callback URL with entity and reference', async () => {
    const result = await verify(multibancoCallbackUrl);

    expect(result).toMatchObject({
      providerEventId: '5Qd8gtWLAEUJ6n0lkS5g:paid',
      providerPaymentId: '5Qd8gtWLAEUJ6n0lkS5g',
      newStatus: 'paid',
      payload: {
        orderId: 'order-1234',
        amount: '1234.56',
        requestId: '5Qd8gtWLAEUJ6n0lkS5g',
        entity: '99999',
        reference: '123456789',
        payment_datetime: '28-10-2021 10:55:21',
      },
    });
  });

  it('does not persist the anti-phishing key in the raw provider payload', async () => {
    const result = await verify(mbWayCallbackUrl);

    expect(result?.payload).not.toHaveProperty('key');
    expect(JSON.stringify(result?.payload)).not.toContain(SECRET);
  });

  it('returns null when the anti-phishing key is missing', async () => {
    const result = await verify(`${BASE_URL}?orderId=1887&amount=33.61&requestId=req-1&payment_datetime=now`);

    expect(result).toBeNull();
  });

  it('returns null when the anti-phishing key does not match the configured secret', async () => {
    const result = await verify(mbWayCallbackUrl, 'different-secret');

    expect(result).toBeNull();
  });

  it('returns null when required query fields are missing', async () => {
    const result = await verify(`${BASE_URL}?key=${SECRET}&orderId=1887&amount=33.61&payment_datetime=now`);

    expect(result).toBeNull();
  });

  it('returns null when Multibanco entity is provided without reference', async () => {
    const result = await verify(
      `${BASE_URL}?key=${SECRET}&orderId=order-1234&amount=1234.56&requestId=req-1&entity=99999&payment_datetime=now`,
    );

    expect(result).toBeNull();
  });

  it('returns null when Multibanco reference is provided without entity', async () => {
    const result = await verify(
      `${BASE_URL}?key=${SECRET}&orderId=order-1234&amount=1234.56&requestId=req-1&reference=123456789&payment_datetime=now`,
    );

    expect(result).toBeNull();
  });

  it('returns null for an invalid request URL', async () => {
    const result = await verify('not-a-url');

    expect(result).toBeNull();
  });
});
