import { describe, expect, it, vi } from 'vitest';
import { createAdoptionViewClient } from '../../packages/client/src/index';
import type {
  AdoptionViewClient,
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
): AdoptionViewClient =>
  createAdoptionViewClient({
    workerBaseUrl,
    adoptionsPath,
    getAccessToken: async () => token,
    fetch,
  });

describe('createAdoptionViewClient', () => {
  it('returns unauthenticated when getAccessToken returns null', async () => {
    const client = makeClient(makeFetch(200, {}), null);
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns unauthenticated when getAccessToken returns empty string', async () => {
    const client = makeClient(makeFetch(200, {}), '   ');
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = makeClient(throwingFetch);
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns unauthenticated on 401', async () => {
    const client = makeClient(makeFetch(401, { status: 'unauthenticated' }));
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(makeFetch(403, { status: 'forbidden' }));
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('forbidden');
    }
  });

  it('returns adoption_not_found on 404', async () => {
    const client = makeClient(makeFetch(404, { status: 'adoption_not_found' }));
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('adoption_not_found');
    }
  });

  it('returns adoption_view_repository_not_configured on 501', async () => {
    const client = makeClient(
      makeFetch(501, { status: 'adoption_view_repository_not_configured' }),
    );
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('adoption_view_repository_not_configured');
    }
  });

  it('returns worker_response_invalid when 200 body is missing required fields', async () => {
    const client = makeClient(makeFetch(200, { status: 'ok' })); // missing applicationId etc.
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_response_invalid');
    }
  });

  it('returns success with application on valid 200', async () => {
    const client = makeClient(
      makeFetch(200, {
        status: 'ok',
        applicationId: 'app-001',
        applicationStatus: 'submitted',
        shelterId: 'shelter-001',
        petId: 'pet-001',
      }),
    );
    const result = await client.loadAdoptionView('app-001');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.application.applicationId).toBe('app-001');
      expect(result.application.applicationStatus).toBe('submitted');
      expect(result.application.shelterId).toBe('shelter-001');
      expect(result.application.petId).toBe('pet-001');
    }
  });

  it('returns application.petId as null when worker returns null', async () => {
    const client = makeClient(
      makeFetch(200, {
        status: 'ok',
        applicationId: 'app-002',
        applicationStatus: 'approved',
        shelterId: 'shelter-001',
        petId: null,
      }),
    );
    const result = await client.loadAdoptionView('app-002');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.application.petId).toBeNull();
    }
  });

  it('strips credential markers from failure reasons', async () => {
    const client = makeClient(
      makeFetch(500, {
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    );
    const result = await client.loadAdoptionView('app-001');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('sends GET request to {adoptionsPath}/{applicationId} with Bearer token', async () => {
    const fetchSpy = makeFetch(200, {
      status: 'ok',
      applicationId: 'app-abc',
      applicationStatus: 'under_review',
      shelterId: 'shelter-xyz',
      petId: null,
    });
    const client = makeClient(fetchSpy, 'my-token');
    await client.loadAdoptionView('app-abc');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toContain('/adoptions/app-abc');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    expect(init.body).toBeUndefined();
  });
});
