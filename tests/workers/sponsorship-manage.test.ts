import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  SponsorshipManageRepository,
  GetSponsorshipForManageResult,
} from '../../apps/workers/src/index';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { EnvironmentRecord } from '@pic4paws/config';

// Import path matcher directly for unit tests
import { matchWorkerSponsorshipManageId as matchManageId } from '../../apps/workers/src/sponsorship-manage';

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

const donorActor: AuthenticatedActor = {
  id: 'donor-user-1',
  authUserId: 'auth-donor-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const unrelatedActor: AuthenticatedActor = {
  id: 'unrelated-user-1',
  authUserId: 'auth-unrelated-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const fakeMemberAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(shelterMemberActor);
const fakeDonorAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(donorActor);
const fakeUnrelatedAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(unrelatedActor);

const sampleSponsorship: GetSponsorshipForManageResult = {
  sponsorshipId: 'sponsorship-001',
  shelterId: 'shelter-a',
  donorUserId: 'donor-user-1',
  currentStatus: 'active',
};

const makeManageRepo = (
  sponsorship: GetSponsorshipForManageResult | null = sampleSponsorship,
): SponsorshipManageRepository => ({
  getSponsorshipForManage: vi.fn().mockResolvedValue(sponsorship),
  updateSponsorshipStatus: vi.fn().mockResolvedValue(undefined),
});

const makePatchRequest = (
  sponsorshipId = 'sponsorship-001',
  body: Record<string, unknown> = { status: 'paused' },
  includeAuth = true,
) =>
  new Request(`https://workers.pic4paws.pt/sponsorships/${sponsorshipId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(includeAuth ? { Authorization: 'Bearer valid-token' } : {}),
    },
    body: JSON.stringify(body),
  });

// ─── Path matcher unit tests ──────────────────────────────────────────────────

describe('matchWorkerSponsorshipManageId — path matcher', () => {
  it('extracts sponsorshipId from /sponsorships/abc123', () => {
    expect(matchManageId('/sponsorships/abc123', '/sponsorships')).toBe('abc123');
  });

  it('returns null for exact /sponsorships (no segment)', () => {
    expect(matchManageId('/sponsorships', '/sponsorships')).toBeNull();
  });

  it('returns null for /sponsorships/abc/extra (too many segments)', () => {
    expect(matchManageId('/sponsorships/abc/extra', '/sponsorships')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchManageId('/donations/abc123', '/sponsorships')).toBeNull();
  });

  it('returns null for empty sponsorshipId segment', () => {
    expect(matchManageId('/sponsorships/', '/sponsorships')).toBeNull();
  });
});

// ─── Integration tests ────────────────────────────────────────────────────────

describe('PATCH /sponsorships/:sponsorshipId — sponsorship manage', () => {
  it('returns 200 with ok status when shelter member updates sponsorship', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipManageRepository: makeManageRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('response includes sponsorshipId and updated status', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest('sponsorship-001', { status: 'paused' }),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipManageRepository: makeManageRepo(),
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(body.sponsorshipId).toBe('sponsorship-001');
    expect(body.status).toBe('ok');
    expect(body.newStatus).toBe('paused');
  });

  it('returns 200 when the donor updates their own sponsorship', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest('sponsorship-001', { status: 'cancelled' }),
      validEnv,
      {
        petDraftAuthenticator: fakeDonorAuth,
        sponsorshipManageRepository: makeManageRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('returns 401 when Authorization header is absent', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest('sponsorship-001', { status: 'paused' }, false),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipManageRepository: makeManageRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 403 when actor is neither shelter member nor donor', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeUnrelatedAuth,
        sponsorshipManageRepository: makeManageRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.status).toBe('forbidden');
  });

  it('returns 404 when sponsorship does not exist', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipManageRepository: makeManageRepo(null),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.status).toBe('sponsorship_not_found');
  });

  it('returns 400 with invalid_sponsorship_manage when payload is missing status', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest('sponsorship-001', {}),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipManageRepository: makeManageRepo(),
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_sponsorship_manage');
    expect(Array.isArray(body.reasons)).toBe(true);
  });

  it('returns 400 when status value is not a valid SponsorshipStatus', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest('sponsorship-001', { status: 'unknown_status' }),
      validEnv,
      {
        petDraftAuthenticator: fakeMemberAuth,
        sponsorshipManageRepository: makeManageRepo(),
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_sponsorship_manage');
  });

  it('returns 405 when method is not PATCH', async () => {
    const request = new Request('https://workers.pic4paws.pt/sponsorships/sponsorship-001', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      sponsorshipManageRepository: makeManageRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 501 when sponsorshipManageRepository is not injected', async () => {
    const response = await handleWorkerRequest(
      makePatchRequest(),
      validEnv,
      { petDraftAuthenticator: fakeMemberAuth },
    );
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('sponsorship_manage_repository_not_configured');
  });

  it('manage route does not conflict with GET /sponsorships donor list route', async () => {
    // GET /sponsorships routes to the donor list handler (not create, not manage)
    const donorListRequest = new Request('https://workers.pic4paws.pt/sponsorships', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await handleWorkerRequest(donorListRequest, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      // no sponsorshipDonorListRepository
    });
    const body = await response.json();

    // Hits donor list handler — 501 when repo not configured (not 405 method_not_allowed)
    expect(response.status).toBe(501);
    expect(body.status).toBe('sponsorship_donor_list_repository_not_configured');
  });
});
