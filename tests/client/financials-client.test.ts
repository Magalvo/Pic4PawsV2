import { describe, expect, it, vi } from 'vitest';
import {
  createFinancialsClient,
} from '../../packages/client/src/index';
import type {
  FinancialsClient,
  FinancialsClientSummary,
} from '../../packages/client/src/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WORKER_BASE = 'https://worker.test';
const SHELTER_PATH = '/shelters' as const;

const makeSummary = (shelterId = 'shelter-1'): FinancialsClientSummary => ({
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

const makeSuccessResponse = (summary: FinancialsClientSummary) =>
  new Response(
    JSON.stringify({ status: 'ok', ...summary }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );

const makeErrorResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const makeClient = (
  fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  token: string | null = 'access-token',
): FinancialsClient =>
  createFinancialsClient({
    workerBaseUrl: WORKER_BASE,
    shelterPath: SHELTER_PATH,
    getAccessToken: vi.fn().mockResolvedValue(token),
    fetch: fetchImpl as never,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createFinancialsClient — unauthenticated', () => {
  it('returns unauthenticated when no access token', async () => {
    const client = makeClient(vi.fn(), null);
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated when access token is empty string', async () => {
    const client = makeClient(vi.fn(), '');
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });
});

describe('createFinancialsClient — network errors', () => {
  it('returns worker_request_failed on network error', async () => {
    const client = makeClient(() => Promise.reject(new Error('network down')));
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_request_failed');
  });
});

describe('createFinancialsClient — error responses', () => {
  it('returns forbidden on 403', async () => {
    const client = makeClient(() =>
      Promise.resolve(makeErrorResponse(403, { status: 'forbidden' })),
    );
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('forbidden');
  });

  it('returns unauthenticated on 401', async () => {
    const client = makeClient(() =>
      Promise.resolve(makeErrorResponse(401, { status: 'unauthenticated' })),
    );
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns financials_repository_not_configured on 501', async () => {
    const client = makeClient(() =>
      Promise.resolve(
        makeErrorResponse(501, { status: 'financials_repository_not_configured' }),
      ),
    );
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('financials_repository_not_configured');
  });

  it('returns worker_request_failed on unexpected error status', async () => {
    const client = makeClient(() =>
      Promise.resolve(makeErrorResponse(500, { status: 'internal_error' })),
    );
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_request_failed');
  });
});

describe('createFinancialsClient — success', () => {
  it('returns ok with summary on 200', async () => {
    const summary = makeSummary();
    const client = makeClient(() => Promise.resolve(makeSuccessResponse(summary)));
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.summary.shelterId).toBe('shelter-1');
      expect(result.summary.currency).toBe('EUR');
    }
  });

  it('returns full donations breakdown', async () => {
    const summary = makeSummary();
    const client = makeClient(() => Promise.resolve(makeSuccessResponse(summary)));
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.donations.count).toBe(5);
      expect(result.summary.donations.paidTotalCents).toBe(50000);
      expect(result.summary.donations.byStatus).toHaveLength(2);
    }
  });

  it('returns sponsorship summary', async () => {
    const summary = makeSummary();
    const client = makeClient(() => Promise.resolve(makeSuccessResponse(summary)));
    const result = await client.loadFinancials('shelter-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.sponsorships.activeCount).toBe(2);
      expect(result.summary.sponsorships.activeTotalCents).toBe(10000);
    }
  });

  it('calls the correct URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSuccessResponse(makeSummary('shelter-42')));
    const client = makeClient(fetchMock);
    await client.loadFinancials('shelter-42');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/shelters/shelter-42/financials'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('does not leak bearer token in summary', async () => {
    const summary = makeSummary();
    const client = makeClient(() => Promise.resolve(makeSuccessResponse(summary)));
    const result = await client.loadFinancials('shelter-1');
    expect(JSON.stringify(result)).not.toContain('service-role');
    expect(JSON.stringify(result)).not.toContain('bearer ');
  });
});
