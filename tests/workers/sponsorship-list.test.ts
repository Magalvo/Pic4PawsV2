import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  SponsorshipListRepository,
  SponsorshipListSummary,
} from '../../apps/workers/src/index';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { EnvironmentRecord } from '@pic4paws/config';

// Import path matcher directly for unit tests
import { matchWorkerSponsorshipListShelterId as matchShelterId } from '../../apps/workers/src/sponsorship-list';

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

const sampleSponsorships: SponsorshipListSummary[] = [
  {
    sponsorshipId: 'sponsorship-001',
    amountCents: 1000,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    recurringInterval: 'monthly',
    status: 'active',
    petId: null,
    createdAt: '2026-06-08T10:00:00.000Z',
  },
];

const makeSponsorshipListRepo = (
  sponsorships: SponsorshipListSummary[] = sampleSponsorships,
  total = 1,
): SponsorshipListRepository => ({
  listSponsorships: vi.fn().mockResolvedValue({ sponsorships, total }),
});

const makeListRequest = (shelterId = 'shelter-a', params?: Record<string, string>) => {
  const url = new URL(`https://workers.pic4paws.pt/shelters/${shelterId}/sponsorships`);
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

// ─── Path matcher unit tests ──────────────────────────────────────────────────

describe('matchWorkerSponsorshipListShelterId — path matcher', () => {
  it('extracts shelterId from /shelters/{id}/sponsorships', () => {
    expect(matchShelterId('/shelters/abc123/sponsorships', '/shelters')).toBe('abc123');
  });

  it('returns null for /shelters/{id} (no suffix)', () => {
    expect(matchShelterId('/shelters/abc123', '/shelters')).toBeNull();
  });

  it('returns null for /shelters/{id}/sponsorships/extra (extra segment)', () => {
    expect(matchShelterId('/shelters/abc123/sponsorships/extra', '/shelters')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchShelterId('/other/abc123/sponsorships', '/shelters')).toBeNull();
  });

  it('returns null for empty shelterId', () => {
    expect(matchShelterId('/shelters//sponsorships', '/shelters')).toBeNull();
  });
});

// ─── Integration tests ────────────────────────────────────────────────────────

describe('GET /shelters/:shelterId/sponsorships — sponsorship list', () => {
  it('returns 200 with ok status for authorized shelter member', async () => {
    const response = await handleWorkerRequest(
      makeListRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipListRepository: makeSponsorshipListRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('response includes sponsorships array and total count', async () => {
    const response = await handleWorkerRequest(
      makeListRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipListRepository: makeSponsorshipListRepo(),
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(Array.isArray(body.sponsorships)).toBe(true);
    expect(body.total).toBe(1);
    const sponsorships = body.sponsorships as SponsorshipListSummary[];
    expect(sponsorships[0]?.sponsorshipId).toBe('sponsorship-001');
    expect(sponsorships[0]?.amountCents).toBe(1000);
    expect(sponsorships[0]?.recurringInterval).toBe('monthly');
  });

  it('returns 401 when Authorization header is absent', async () => {
    const request = new Request(
      'https://workers.pic4paws.pt/shelters/shelter-a/sponsorships',
      { method: 'GET' },
    );

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      sponsorshipListRepository: makeSponsorshipListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator returns null', async () => {
    const nullAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(null);

    const response = await handleWorkerRequest(
      makeListRequest(),
      validEnv,
      {
        petDraftAuthenticator: nullAuth,
        sponsorshipListRepository: makeSponsorshipListRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 403 when actor has no membership for the shelter', async () => {
    const response = await handleWorkerRequest(
      makeListRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeAdopterAuth,
        sponsorshipListRepository: makeSponsorshipListRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.status).toBe('forbidden');
  });

  it('returns 501 when sponsorshipListRepository is not injected', async () => {
    const response = await handleWorkerRequest(
      makeListRequest(),
      validEnv,
      { petDraftAuthenticator: fakeMemberAuth },
    );
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('sponsorship_list_repository_not_configured');
  });

  it('returns 405 for POST /shelters/:shelterId/sponsorships', async () => {
    const request = new Request(
      'https://workers.pic4paws.pt/shelters/shelter-a/sponsorships',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
      },
    );

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      sponsorshipListRepository: makeSponsorshipListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns empty sponsorships and zero total when none exist', async () => {
    const response = await handleWorkerRequest(
      makeListRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipListRepository: makeSponsorshipListRepo([], 0),
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.sponsorships).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('passes limit and offset query params to the repository', async () => {
    const repo = makeSponsorshipListRepo();
    await handleWorkerRequest(
      makeListRequest('shelter-a', { limit: '10', offset: '20' }),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipListRepository: repo,
      },
    );

    expect(vi.mocked(repo.listSponsorships)).toHaveBeenCalledWith(
      expect.objectContaining({ shelterId: 'shelter-a', limit: 10, offset: 20 }),
    );
  });

  it('response body never contains credential markers', async () => {
    const response = await handleWorkerRequest(
      makeListRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipListRepository: makeSponsorshipListRepo(),
      },
    );
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
