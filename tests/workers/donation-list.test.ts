import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type { DonationListRepository, DonationListSummary } from '../../apps/workers/src/index';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { EnvironmentRecord } from '@pic4paws/config';

const validEnv: EnvironmentRecord = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const shelterMemberActor: AuthenticatedActor = {
  id: 'user-shelter-1',
  authUserId: 'auth-shelter-1',
  role: 'shelter_member',
  status: 'active',
  memberships: [
    {
      id: 'membership-1',
      userId: 'user-shelter-1',
      shelterId: 'shelter-a',
      role: 'shelter_member',
      deletedAt: null,
    },
  ],
};

const adopterActor: AuthenticatedActor = {
  id: 'user-adopter-1',
  authUserId: 'auth-adopter-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const fakeMemberAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(shelterMemberActor);
const fakeAdopterAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(adopterActor);

const sampleDonations: DonationListSummary[] = [
  {
    donationId: 'donation-001',
    kind: 'one_time_donation',
    status: 'paid',
    amountCents: 1000,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    anonymous: false,
    donorDisplayName: 'João Silva',
    publicMessage: 'Força abrigo!',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
];

const makeDonationListRepo = (
  donations: DonationListSummary[] = sampleDonations,
  total = 1,
): DonationListRepository => ({
  listDonations: vi.fn().mockResolvedValue({ donations, total }),
});

const makeListRequest = (shelterId = 'shelter-a', params?: Record<string, string>) => {
  const url = new URL(`https://workers.pic4paws.pt/shelters/${shelterId}/donations`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return new Request(url.toString(), {
    method: 'GET',
    headers: { Authorization: 'Bearer valid-token' },
  });
};

describe('GET /shelters/:shelterId/donations — donation list', () => {
  it('returns 200 with ok status for authorized shelter member', async () => {
    const repo = makeDonationListRepo();
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      donationListRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('response includes donations array and total count', async () => {
    const repo = makeDonationListRepo();
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      donationListRepository: repo,
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(Array.isArray(body.donations)).toBe(true);
    expect(body.total).toBe(1);
    const donations = body.donations as DonationListSummary[];
    expect(donations[0]?.donationId).toBe('donation-001');
    expect(donations[0]?.amountCents).toBe(1000);
    expect(donations[0]?.donorDisplayName).toBe('João Silva');
  });

  it('returns 401 when Authorization header is absent', async () => {
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a/donations', {
      method: 'GET',
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      donationListRepository: makeDonationListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator returns null', async () => {
    const nullAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(null);
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: nullAuth,
      donationListRepository: makeDonationListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 403 when actor has no membership for the shelter', async () => {
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAdopterAuth,
      donationListRepository: makeDonationListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.status).toBe('forbidden');
  });

  it('returns 501 when donationListRepository is not injected', async () => {
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
    });
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('donation_list_repository_not_configured');
  });

  it('returns 405 for POST /shelters/:shelterId/donations', async () => {
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a/donations', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      donationListRepository: makeDonationListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns empty donations and zero total when none exist', async () => {
    const repo = makeDonationListRepo([], 0);
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      donationListRepository: repo,
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.donations).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('passes limit and offset query params to the repository', async () => {
    const repo = makeDonationListRepo();
    const request = makeListRequest('shelter-a', { limit: '10', offset: '20' });

    await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      donationListRepository: repo,
    });

    expect(vi.mocked(repo.listDonations)).toHaveBeenCalledWith(
      expect.objectContaining({ shelterId: 'shelter-a', limit: 10, offset: 20 }),
    );
  });

  it('response body never contains credential markers', async () => {
    const repo = makeDonationListRepo();
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      donationListRepository: repo,
    });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
