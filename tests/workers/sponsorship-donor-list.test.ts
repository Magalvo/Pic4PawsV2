import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  SponsorshipDonorListRepository,
  SponsorshipListSummary,
} from '../../apps/workers/src/index';
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
  WORKER_ADOPTIONS_PATH: '/adoptions',
  WORKER_DONATIONS_PATH: '/donations',
  WORKER_SPONSORSHIPS_PATH: '/sponsorships',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const donorActor: AuthenticatedActor = {
  id: 'donor-user-1',
  authUserId: 'auth-donor-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const fakeDonorAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(donorActor);

const sampleSponsorships: SponsorshipListSummary[] = [
  {
    sponsorshipId: 'spons-001',
    amountCents: 1500,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    recurringInterval: 'monthly',
    status: 'active',
    petId: 'pet-a',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
  {
    sponsorshipId: 'spons-002',
    amountCents: 500,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    recurringInterval: 'monthly',
    status: 'paused',
    petId: null,
    createdAt: '2026-06-07T09:00:00.000Z',
  },
];

const makeDonorListRepo = (
  sponsorships: SponsorshipListSummary[] = sampleSponsorships,
  total = 2,
): SponsorshipDonorListRepository => ({
  listDonorSponsorships: vi.fn().mockResolvedValue({ sponsorships, total }),
});

const makeGetRequest = (params?: Record<string, string>) => {
  const url = new URL('https://workers.pic4paws.pt/sponsorships');
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

// ─── Integration tests ────────────────────────────────────────────────────────

describe('GET /sponsorships — donor-facing sponsorship list', () => {
  it('returns 200 with ok status for authenticated donor', async () => {
    const response = await handleWorkerRequest(makeGetRequest(), validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
      sponsorshipDonorListRepository: makeDonorListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('response includes sponsorships array and total count', async () => {
    const response = await handleWorkerRequest(makeGetRequest(), validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
      sponsorshipDonorListRepository: makeDonorListRepo(),
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(Array.isArray(body.sponsorships)).toBe(true);
    expect(body.total).toBe(2);
    const sponsorships = body.sponsorships as SponsorshipListSummary[];
    expect(sponsorships).toHaveLength(2);
    expect(sponsorships[0]?.sponsorshipId).toBe('spons-001');
    expect(sponsorships[1]?.status).toBe('paused');
  });

  it('returns 401 when Authorization header is absent', async () => {
    const request = new Request('https://workers.pic4paws.pt/sponsorships', {
      method: 'GET',
    });
    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
      sponsorshipDonorListRepository: makeDonorListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator returns null', async () => {
    const nullAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(null);
    const response = await handleWorkerRequest(makeGetRequest(), validEnv, {
      petDraftAuthenticator: nullAuth,
      sponsorshipDonorListRepository: makeDonorListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when authenticator is not configured', async () => {
    const response = await handleWorkerRequest(makeGetRequest(), validEnv, {
      sponsorshipDonorListRepository: makeDonorListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 501 when sponsorshipDonorListRepository is not injected', async () => {
    const response = await handleWorkerRequest(makeGetRequest(), validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
    });
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('sponsorship_donor_list_repository_not_configured');
  });

  it('passes donorUserId (actor.id), limit and offset to the repository', async () => {
    const repo = makeDonorListRepo();
    await handleWorkerRequest(makeGetRequest({ limit: '10', offset: '30' }), validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
      sponsorshipDonorListRepository: repo,
    });

    expect(vi.mocked(repo.listDonorSponsorships)).toHaveBeenCalledWith(
      expect.objectContaining({ donorUserId: 'donor-user-1', limit: 10, offset: 30 }),
    );
  });

  it('returns empty sponsorships and zero total when donor has none', async () => {
    const response = await handleWorkerRequest(makeGetRequest(), validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
      sponsorshipDonorListRepository: makeDonorListRepo([], 0),
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.sponsorships).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('does not conflict with POST /sponsorships (POST routes to create handler, not donor list)', async () => {
    const postRequest = new Request('https://workers.pic4paws.pt/sponsorships', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amountCents: 1000, currency: 'EUR' }),
    });
    const response = await handleWorkerRequest(postRequest, validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
      sponsorshipDonorListRepository: makeDonorListRepo(),
    });
    const body = (await response.json()) as Record<string, unknown>;

    // POST falls through to handleWorkerSponsorshipRequest — invalid payload → 400
    // (not the 200/ok from the donor list handler)
    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_sponsorship');
  });

  it('response body never contains credential markers', async () => {
    const response = await handleWorkerRequest(makeGetRequest(), validEnv, {
      petDraftAuthenticator: fakeDonorAuth,
      sponsorshipDonorListRepository: makeDonorListRepo(),
    });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
