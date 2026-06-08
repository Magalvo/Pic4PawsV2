import { describe, expect, it, vi } from 'vitest';
import { createAdoptionStatusClient } from '../../packages/client/src/index';
import type {
  AdoptionStatusClient,
  MediaUploadClientFetch,
} from '../../packages/client/src/index';

const workerBaseUrl = 'https://workers.pic4paws.pt';
const adoptionsPath = '/adoptions' as const;

const makeFetch = (
  status: number,
  body: Record<string, unknown>,
): MediaUploadClientFetch =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

const throwingFetch: MediaUploadClientFetch = vi.fn().mockRejectedValue(
  new Error('Network error'),
);

const makeClient = (
  fetch: MediaUploadClientFetch,
  token: string | null = 'valid-token',
): AdoptionStatusClient =>
  createAdoptionStatusClient({
    workerBaseUrl,
    adoptionsPath,
    getAccessToken: async () => token,
    fetch,
  });

describe('createAdoptionStatusClient', () => {
  it('returns unauthenticated when getAccessToken returns null', async () => {
    const client = makeClient(makeFetch(200, {}), null);
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns unauthenticated when getAccessToken returns empty string', async () => {
    const client = makeClient(makeFetch(200, {}), '   ');
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = makeClient(throwingFetch);
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns unauthenticated on 401', async () => {
    const client = makeClient(makeFetch(401, { status: 'unauthenticated' }));
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(makeFetch(403, { status: 'forbidden' }));
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('forbidden');
    }
  });

  it('returns adoption_not_found on 404', async () => {
    const client = makeClient(makeFetch(404, { status: 'adoption_not_found' }));
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('adoption_not_found');
    }
  });

  it('returns invalid_adoption_status on 400', async () => {
    const client = makeClient(
      makeFetch(400, { status: 'invalid_adoption_status', reasons: ['status_invalid'] }),
    );
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('invalid_adoption_status');
    }
  });

  it('returns success with applicationId and newStatus on 200', async () => {
    const client = makeClient(
      makeFetch(200, {
        status: 'ok',
        applicationId: 'app-001',
        newStatus: 'approved',
      }),
    );
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.applicationId).toBe('app-001');
      expect(result.newStatus).toBe('approved');
    }
  });

  it('returns worker_response_invalid when 200 body is malformed', async () => {
    const client = makeClient(makeFetch(200, { status: 'ok' })); // missing applicationId / newStatus
    const result = await client.manageAdoptionStatus('app-001', 'approved');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_response_invalid');
    }
  });

  it('strips credential markers from failure reasons', async () => {
    const client = makeClient(
      makeFetch(500, {
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    );
    const result = await client.manageAdoptionStatus('app-001', 'approved');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('sends PATCH request to {adoptionsPath}/{applicationId} with Bearer token and status in body', async () => {
    const fetchSpy = makeFetch(200, {
      status: 'ok',
      applicationId: 'app-abc',
      newStatus: 'under_review',
    });
    const client = makeClient(fetchSpy, 'my-token');
    await client.manageAdoptionStatus('app-abc', 'under_review');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toContain('/adoptions/app-abc');
    expect(init.method).toBe('PATCH');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    expect(JSON.parse(init.body as string)).toEqual({ status: 'under_review' });
  });
});
