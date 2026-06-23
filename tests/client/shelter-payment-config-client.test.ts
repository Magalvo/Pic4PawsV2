import { describe, expect, it, vi } from 'vitest';
import {
  createSavePaymentConfigClient,
  createLoadPaymentConfigClient,
} from '../../packages/client/src/index';
import type {
  ShelterPaymentConfigClientSuccess,
  LoadPaymentConfigClientSuccess,
} from '../../packages/client/src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WORKER_URL = 'https://workers.pic4paws.pt';
const SHELTER_PATH = '/shelters';
const SHELTER_ID = 'shelter-aaa';
const VALID_IBAN = 'PT50000201231234567890154';
const VALID_TOKEN = 'valid-access-token';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const makeSaveClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(VALID_TOKEN),
) =>
  createSavePaymentConfigClient({
    workerBaseUrl: WORKER_URL,
    shelterPath: SHELTER_PATH,
    getAccessToken,
    fetch: fetch as never,
  });

const makeLoadClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(VALID_TOKEN),
) =>
  createLoadPaymentConfigClient({
    workerBaseUrl: WORKER_URL,
    shelterPath: SHELTER_PATH,
    getAccessToken,
    fetch: fetch as never,
  });

// ─── createSavePaymentConfigClient ────────────────────────────────────────────

describe('createSavePaymentConfigClient.savePaymentConfig', () => {
  it('returns unauthenticated when access token is null', async () => {
    const fetch = makeFetch(401, { status: 'unauthenticated' });
    const result = await makeSaveClient(
      fetch,
      () => Promise.resolve(null),
    ).savePaymentConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns invalid_config on server-side 400 with reasons', async () => {
    const fetch = makeFetch(400, { status: 'invalid_config', reasons: ['iban_required'] });
    const result = await makeSaveClient(fetch).savePaymentConfig(SHELTER_ID, { iban: '' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('invalid_config');
    if (!result.ok) expect(result.reasons).toContain('iban_required');
  });

  it('returns forbidden on 403', async () => {
    const fetch = makeFetch(403, { status: 'forbidden' });
    const result = await makeSaveClient(fetch).savePaymentConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('forbidden');
  });

  it('returns payment_config_saved on success', async () => {
    const fetch = makeFetch(200, {
      status: 'payment_config_saved',
      tier: 'manual',
      iban: VALID_IBAN,
      mbWayPhone: null,
    });
    const result = await makeSaveClient(fetch).savePaymentConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(result.ok).toBe(true);
    const success = result as ShelterPaymentConfigClientSuccess;
    expect(success.status).toBe('payment_config_saved');
    expect(success.tier).toBe('manual');
    expect(success.iban).toBe(VALID_IBAN);
    expect(success.mbWayPhone).toBeNull();
  });

  it('includes mbWayPhone in success response when provided', async () => {
    const phone = '+351912345678';
    const fetch = makeFetch(200, {
      status: 'payment_config_saved',
      tier: 'manual',
      iban: VALID_IBAN,
      mbWayPhone: phone,
    });
    const result = await makeSaveClient(fetch).savePaymentConfig(SHELTER_ID, {
      iban: VALID_IBAN,
      mbWayPhone: phone,
    });
    const success = result as ShelterPaymentConfigClientSuccess;
    expect(success.mbWayPhone).toBe(phone);
  });

  it('constructs URL as {workerBaseUrl}/shelters/{shelterId}/payment-config', async () => {
    const fetch = makeFetch(200, {
      status: 'payment_config_saved',
      tier: 'manual',
      iban: VALID_IBAN,
      mbWayPhone: null,
    });
    await makeSaveClient(fetch).savePaymentConfig(SHELTER_ID, { iban: VALID_IBAN });
    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe(`${WORKER_URL}/shelters/${SHELTER_ID}/payment-config`);
  });

  it('sends POST with Authorization header and JSON body', async () => {
    const fetch = makeFetch(200, {
      status: 'payment_config_saved',
      tier: 'manual',
      iban: VALID_IBAN,
      mbWayPhone: null,
    });
    await makeSaveClient(fetch).savePaymentConfig(SHELTER_ID, { iban: VALID_IBAN });
    const [, opts] = fetch.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe('POST');
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${VALID_TOKEN}`);
    const body = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect(body.iban).toBe(VALID_IBAN);
    expect(body.mbWayPhone).toBeNull();
  });

  it('returns worker_request_failed on network error', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network'));
    const result = await makeSaveClient(fetch as never).savePaymentConfig(SHELTER_ID, {
      iban: VALID_IBAN,
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_request_failed');
  });
});

// ─── createLoadPaymentConfigClient ────────────────────────────────────────────

describe('createLoadPaymentConfigClient.loadPaymentConfig', () => {
  it('returns unauthenticated when access token is null', async () => {
    const fetch = makeFetch(401, { status: 'unauthenticated' });
    const result = await makeLoadClient(
      fetch,
      () => Promise.resolve(null),
    ).loadPaymentConfig(SHELTER_ID);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns configured:false when no config exists', async () => {
    const fetch = makeFetch(200, { status: 'ok', configured: false });
    const result = await makeLoadClient(fetch).loadPaymentConfig(SHELTER_ID);
    expect(result.ok).toBe(true);
    const success = result as LoadPaymentConfigClientSuccess;
    expect(success.status).toBe('ok');
    expect(success.configured).toBe(false);
    expect(success.tier).toBeNull();
    expect(success.iban).toBeNull();
    expect(success.mbWayPhone).toBeNull();
  });

  it('returns full config when configured:true', async () => {
    const fetch = makeFetch(200, {
      status: 'ok',
      configured: true,
      tier: 'manual',
      iban: VALID_IBAN,
      mbWayPhone: '+351912345678',
    });
    const result = await makeLoadClient(fetch).loadPaymentConfig(SHELTER_ID);
    expect(result.ok).toBe(true);
    const success = result as LoadPaymentConfigClientSuccess;
    expect(success.configured).toBe(true);
    expect(success.tier).toBe('manual');
    expect(success.iban).toBe(VALID_IBAN);
    expect(success.mbWayPhone).toBe('+351912345678');
  });

  it('constructs URL as {workerBaseUrl}/shelters/{shelterId}/payment-config', async () => {
    const fetch = makeFetch(200, { status: 'ok', configured: false });
    await makeLoadClient(fetch).loadPaymentConfig(SHELTER_ID);
    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe(`${WORKER_URL}/shelters/${SHELTER_ID}/payment-config`);
  });

  it('sends GET with Authorization header', async () => {
    const fetch = makeFetch(200, { status: 'ok', configured: false });
    await makeLoadClient(fetch).loadPaymentConfig(SHELTER_ID);
    const [, opts] = fetch.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe('GET');
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${VALID_TOKEN}`);
  });

  it('returns worker_request_failed on network error', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network'));
    const result = await makeLoadClient(fetch as never).loadPaymentConfig(SHELTER_ID);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_request_failed');
  });
});
