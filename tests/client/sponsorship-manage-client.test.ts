import { describe, expect, it, vi } from 'vitest';
import { createSponsorshipManageClient } from '../../packages/client/src/index';
import type {
  SponsorshipManageClient,
} from '../../packages/client/src/index';
import type { MediaUploadClientFetch } from '../../packages/client/src/index';

const workerBaseUrl = 'https://workers.pic4paws.pt';
const sponsorshipsPath = '/sponsorships' as const;

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
): SponsorshipManageClient =>
  createSponsorshipManageClient({
    workerBaseUrl,
    sponsorshipsPath,
    getAccessToken: async () => token,
    fetch,
  });

describe('createSponsorshipManageClient', () => {
  it('returns unauthenticated when getAccessToken returns null', async () => {
    const client = makeClient(makeFetch(200, {}), null);
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns unauthenticated when getAccessToken returns empty string', async () => {
    const client = makeClient(makeFetch(200, {}), '   ');
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns worker_request_failed with network_error when fetch throws', async () => {
    const client = makeClient(throwingFetch);
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
      expect(result.reasons).toContain('network_error');
    }
  });

  it('returns unauthenticated on 401', async () => {
    const client = makeClient(makeFetch(401, { status: 'unauthenticated' }));
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(makeFetch(403, { status: 'forbidden' }));
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('forbidden');
    }
  });

  it('returns sponsorship_not_found on 404', async () => {
    const client = makeClient(makeFetch(404, { status: 'sponsorship_not_found' }));
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('sponsorship_not_found');
    }
  });

  it('returns invalid_sponsorship_manage on 400', async () => {
    const client = makeClient(
      makeFetch(400, { status: 'invalid_sponsorship_manage', reasons: ['status_invalid'] }),
    );
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('invalid_sponsorship_manage');
    }
  });

  it('returns success with sponsorshipId and newStatus on 200', async () => {
    const client = makeClient(
      makeFetch(200, {
        status: 'ok',
        sponsorshipId: 'sponsorship-001',
        newStatus: 'paused',
      }),
    );
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.sponsorshipId).toBe('sponsorship-001');
      expect(result.newStatus).toBe('paused');
    }
  });

  it('returns worker_response_invalid when 200 body is malformed', async () => {
    const client = makeClient(makeFetch(200, { status: 'ok' })); // missing sponsorshipId / newStatus
    const result = await client.manageSponsorship('sponsorship-001', 'paused');

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
    const result = await client.manageSponsorship('sponsorship-001', 'paused');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('sends PATCH request to {sponsorshipsPath}/{sponsorshipId} with Bearer token', async () => {
    const fetchSpy = makeFetch(200, {
      status: 'ok',
      sponsorshipId: 'spons-abc',
      newStatus: 'cancelled',
    });
    const client = makeClient(fetchSpy, 'my-token');
    await client.manageSponsorship('spons-abc', 'cancelled');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toContain('/sponsorships/spons-abc');
    expect(init.method).toBe('PATCH');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });
});
