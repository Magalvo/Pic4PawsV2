import { describe, expect, it, vi } from 'vitest';
import {
  createAdminPendingSheltersClient,
  type AdminPendingShelterClientSummary,
  type AdminPendingSheltersClientSuccess,
} from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const validToken = 'valid-access-token';

const makeClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(validToken),
) =>
  createAdminPendingSheltersClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    shelterPath: '/shelters',
    getAccessToken,
    fetch: fetch as never,
  });

const sampleShelter: AdminPendingShelterClientSummary = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter',
  verificationStatus: 'pending_review',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  publicEmail: 'contacto@abrigo.pt',
  publicPhone: '+351912345678',
  logoMediaId: null,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-10T10:00:00.000Z',
};

const successBody = {
  status: 'ok',
  shelters: [sampleShelter],
  total: 1,
};

describe('createAdminPendingSheltersClient', () => {
  it('returns ok with pending shelters and total on valid 200 response', async () => {
    const fetch = makeFetch(200, successBody);
    const result = await makeClient(fetch).loadPendingShelters();

    expect(result).toEqual({
      ok: true,
      status: 'ok',
      shelters: [sampleShelter],
      total: 1,
    });
  });

  it('result includes typed pending shelter fields', async () => {
    const fetch = makeFetch(200, successBody);
    const result = (await makeClient(fetch).loadPendingShelters()) as AdminPendingSheltersClientSuccess;

    expect(result.shelters[0]?.id).toBe('shelter-a');
    expect(result.shelters[0]?.verificationStatus).toBe('pending_review');
    expect(result.shelters[0]?.publicEmail).toBe('contacto@abrigo.pt');
    expect(result.total).toBe(1);
  });

  it('sends GET to {workerBaseUrl}/shelters/pending-verification', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).loadPendingShelters();

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/shelters/pending-verification');
    expect((fetch.mock.calls[0][1] as RequestInit).method).toBe('GET');
  });

  it('adds limit and offset query params when provided', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).loadPendingShelters({ limit: 10, offset: 20 });

    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('offset')).toBe('20');
  });

  it('omits query params when query is absent', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).loadPendingShelters();

    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.search).toBe('');
  });

  it('sends Authorization header with Bearer token', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).loadPendingShelters();

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)['Authorization']).toBe(
      `Bearer ${validToken}`,
    );
  });

  it('returns unauthenticated and does not fetch when access token is missing', async () => {
    const fetch = makeFetch(200, successBody);
    const result = await makeClient(fetch, () => Promise.resolve(null)).loadPendingShelters();

    expect(result).toMatchObject({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns unauthenticated and does not fetch when access token is blank', async () => {
    const fetch = makeFetch(200, successBody);
    const result = await makeClient(fetch, () => Promise.resolve('  ')).loadPendingShelters();

    expect(result).toMatchObject({ ok: false, status: 'unauthenticated' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('maps route failure statuses to typed failures', async () => {
    const cases = [
      ['unauthenticated', 401],
      ['forbidden', 403],
      ['auth_adapter_not_configured', 501],
      ['admin_pending_shelters_repository_not_configured', 501],
    ] as const;

    for (const [status, httpStatus] of cases) {
      const fetch = makeFetch(httpStatus, { status });
      const result = await makeClient(fetch).loadPendingShelters();

      expect(result).toMatchObject({ ok: false, status, reasons: [status] });
    }
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));
    const result = await makeClient(fetch).loadPendingShelters();

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
  });

  it('returns worker_response_invalid on malformed 200 body', async () => {
    const fetch = makeFetch(200, { status: 'ok', shelters: [{ id: 'missing-fields' }], total: 1 });
    const result = await makeClient(fetch).loadPendingShelters();

    expect(result).toMatchObject({
      ok: false,
      status: 'worker_response_invalid',
      reasons: ['invalid_worker_response'],
    });
  });

  it('sanitizes credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'server_error',
      reasons: ['safe_reason', 'service-role-secret', 'bearer token-value'],
    });

    const result = await makeClient(fetch).loadPendingShelters();
    const serialized = JSON.stringify(result);

    expect(serialized).toContain('safe_reason');
    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer token-value');
  });
});
