import { describe, expect, it, vi } from 'vitest';
import {
  matchWorkerFinancialsShelterId,
  handleWorkerFinancialsRequest,
} from '../../apps/workers/src/financials';
import type { FinancialsRepository, FinancialsSummary } from '../../apps/workers/src/financials';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SHELTER_PATH = '/shelters';

const makeRequest = (
  pathname: string,
  method = 'GET',
  token: string | null = 'tok',
): Request => {
  const url = `https://worker.test${pathname}`;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, { method, headers });
};

const makeActor = (id = 'user-1', shelterIds: string[] = ['shelter-1']) => ({
  id,
  authUserId: `auth-${id}`,
  role: 'shelter_owner' as const,
  status: 'active' as const,
  memberships: shelterIds.map((shelterId) => ({
    id: `membership-${shelterId}`,
    userId: id,
    shelterId,
    role: 'shelter_owner' as const,
    deletedAt: null,
  })),
});

const makeSummary = (shelterId = 'shelter-1'): FinancialsSummary => ({
  shelterId,
  currency: 'EUR',
  donations: {
    count: 5,
    paidTotalCents: 50000,
    byStatus: [
      { status: 'paid', count: 3, totalCents: 30000 },
      { status: 'pending_payment', count: 2, totalCents: 20000 },
    ],
  },
  sponsorships: {
    activeCount: 2,
    pausedCount: 1,
    cancelledCount: 0,
    activeTotalCents: 10000,
  },
});

const makeRepo = (summary: FinancialsSummary = makeSummary()): FinancialsRepository => ({
  getFinancials: vi.fn().mockResolvedValue(summary),
});

const makeAuthenticator = (actor: ReturnType<typeof makeActor> | null = makeActor()) =>
  vi.fn().mockResolvedValue(actor);

// ─── matchWorkerFinancialsShelterId ──────────────────────────────────────────

describe('matchWorkerFinancialsShelterId', () => {
  it('matches /shelters/{id}/financials', () => {
    expect(matchWorkerFinancialsShelterId('/shelters/abc123/financials', SHELTER_PATH)).toBe(
      'abc123',
    );
  });

  it('returns null for /shelters/{id} (no suffix)', () => {
    expect(matchWorkerFinancialsShelterId('/shelters/abc123', SHELTER_PATH)).toBeNull();
  });

  it('returns null for /shelters/{id}/donations', () => {
    expect(matchWorkerFinancialsShelterId('/shelters/abc123/donations', SHELTER_PATH)).toBeNull();
  });

  it('returns null for /shelters/{id}/financials/extra', () => {
    expect(
      matchWorkerFinancialsShelterId('/shelters/abc123/financials/extra', SHELTER_PATH),
    ).toBeNull();
  });

  it('returns null for /shelters (no shelterId)', () => {
    expect(matchWorkerFinancialsShelterId('/shelters', SHELTER_PATH)).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchWorkerFinancialsShelterId('/other/abc123/financials', SHELTER_PATH)).toBeNull();
  });

  it('returns null if shelterId contains /', () => {
    expect(matchWorkerFinancialsShelterId('/shelters/a/b/financials', SHELTER_PATH)).toBeNull();
  });
});

// ─── handleWorkerFinancialsRequest ───────────────────────────────────────────

describe('handleWorkerFinancialsRequest — method check', () => {
  it('returns 405 for POST', async () => {
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials', 'POST'),
      shelterId: 'shelter-1',
    });
    expect(res.status).toBe(405);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('method_not_allowed');
  });
});

describe('handleWorkerFinancialsRequest — auth', () => {
  it('returns 401 when no Bearer token', async () => {
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials', 'GET', null),
      shelterId: 'shelter-1',
    });
    expect(res.status).toBe(401);
  });

  it('returns 501 when authenticator not configured', async () => {
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials'),
      shelterId: 'shelter-1',
    });
    expect(res.status).toBe(501);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator returns null', async () => {
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials'),
      shelterId: 'shelter-1',
      authenticator: makeAuthenticator(null),
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 when actor is not a shelter member', async () => {
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials'),
      shelterId: 'shelter-1',
      authenticator: makeAuthenticator(makeActor('user-1', ['other-shelter'])),
    });
    expect(res.status).toBe(403);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('forbidden');
  });
});

describe('handleWorkerFinancialsRequest — repository', () => {
  it('returns 501 when repository not configured', async () => {
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials'),
      shelterId: 'shelter-1',
      authenticator: makeAuthenticator(),
    });
    expect(res.status).toBe(501);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('financials_repository_not_configured');
  });
});

describe('handleWorkerFinancialsRequest — success', () => {
  it('returns 200 with financials summary', async () => {
    const summary = makeSummary();
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials'),
      shelterId: 'shelter-1',
      authenticator: makeAuthenticator(),
      financialsRepository: makeRepo(summary),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; shelterId: string; currency: string };
    expect(body.status).toBe('ok');
    expect(body.shelterId).toBe('shelter-1');
    expect(body.currency).toBe('EUR');
  });

  it('calls getFinancials with the shelterId', async () => {
    const repo = makeRepo();
    await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-42/financials'),
      shelterId: 'shelter-42',
      authenticator: makeAuthenticator(makeActor('user-1', ['shelter-42'])),
      financialsRepository: repo,
    });
    expect(repo.getFinancials).toHaveBeenCalledWith('shelter-42');
  });

  it('includes donations and sponsorships in response', async () => {
    const summary = makeSummary();
    const res = await handleWorkerFinancialsRequest({
      request: makeRequest('/shelters/shelter-1/financials'),
      shelterId: 'shelter-1',
      authenticator: makeAuthenticator(),
      financialsRepository: makeRepo(summary),
    });
    const body = await res.json() as {
      donations: { count: number; paidTotalCents: number };
      sponsorships: { activeCount: number; activeTotalCents: number };
    };
    expect(body.donations.count).toBe(5);
    expect(body.donations.paidTotalCents).toBe(50000);
    expect(body.sponsorships.activeCount).toBe(2);
    expect(body.sponsorships.activeTotalCents).toBe(10000);
  });
});
