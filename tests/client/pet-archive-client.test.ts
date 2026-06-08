import { describe, expect, it, vi } from 'vitest';
import { createPetArchiveClient } from '../../packages/client/src/index';
import type {
  MediaUploadClientFetch,
  PetArchiveClient,
} from '../../packages/client/src/index';

const workerBaseUrl = 'https://workers.pic4paws.pt';
const petFeedPath = '/pets' as const;

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
): PetArchiveClient =>
  createPetArchiveClient({
    workerBaseUrl,
    petFeedPath,
    getAccessToken: async () => token,
    fetch,
  });

describe('createPetArchiveClient — archivePet', () => {
  it('returns unauthenticated when getAccessToken returns null', async () => {
    const client = makeClient(makeFetch(200, {}), null);
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated when getAccessToken returns blank string', async () => {
    const client = makeClient(makeFetch(200, {}), '  ');
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = makeClient(throwingFetch);
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns unauthenticated on 401', async () => {
    const client = makeClient(makeFetch(401, { status: 'unauthenticated' }));
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(makeFetch(403, { status: 'forbidden' }));
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('forbidden');
  });

  it('returns pet_not_found on 404', async () => {
    const client = makeClient(makeFetch(404, { status: 'pet_not_found' }));
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('pet_not_found');
  });

  it('returns pet_already_archived on 409', async () => {
    const client = makeClient(makeFetch(409, { status: 'pet_already_archived' }));
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('pet_already_archived');
  });

  it('returns pet_archive_repository_not_configured on 501', async () => {
    const client = makeClient(
      makeFetch(501, { status: 'pet_archive_repository_not_configured' }),
    );
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('pet_archive_repository_not_configured');
  });

  it('returns worker_response_invalid when 200 body is missing petId', async () => {
    const client = makeClient(makeFetch(200, { status: 'ok' }));
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_response_invalid');
  });

  it('returns success with petId on valid 200', async () => {
    const client = makeClient(
      makeFetch(200, { status: 'ok', petId: 'pet-001' }),
    );
    const result = await client.archivePet('pet-001');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.petId).toBe('pet-001');
    }
  });

  it('sends PATCH to {petFeedPath}/{petId}/status with Bearer token and archived body', async () => {
    const fetchSpy = makeFetch(200, { status: 'ok', petId: 'pet-abc' });
    const client = makeClient(fetchSpy, 'my-token');
    await client.archivePet('pet-abc');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain('/pets/pet-abc/status');
    expect(init.method).toBe('PATCH');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    expect(init.body).toBeDefined();
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(parsed.status).toBe('archived');
  });

  it('strips credential markers from failure reasons', async () => {
    const client = makeClient(
      makeFetch(500, {
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    );
    const result = await client.archivePet('pet-001');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });
});
