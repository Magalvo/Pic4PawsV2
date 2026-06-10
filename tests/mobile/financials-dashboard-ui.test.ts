import { describe, expect, it, vi } from 'vitest';
import {
  createMobileFinancialsDashboardUi,
  mobileFinancialsDashboardUiContent,
} from '../../apps/mobile/src/financials';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  FinancialsClient,
  LoadFinancialsClientResult,
  FinancialsClientSummary,
} from '../../packages/client/src/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const makeClient = (result: LoadFinancialsClientResult): Pick<FinancialsClient, 'loadFinancials'> => ({
  loadFinancials: vi.fn().mockResolvedValue(result),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mobileFinancialsDashboardUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(mobileFinancialsDashboardUiContent.locale).toBe('pt-PT');
    expect(mobileFinancialsDashboardUiContent.status).toBe('product-flow-ready');
  });

  it('has non-empty title and description', () => {
    expect(mobileFinancialsDashboardUiContent.title).toBeTruthy();
    expect(mobileFinancialsDashboardUiContent.description).toBeTruthy();
  });

  it('has non-empty loadingMessage', () => {
    expect(mobileFinancialsDashboardUiContent.loadingMessage).toBeTruthy();
  });
});

describe('createMobileFinancialsDashboardUi — initial state', () => {
  it('getInitialState returns idle', () => {
    const ui = createMobileFinancialsDashboardUi({
      financialsClient: makeClient({ ok: true, status: 'ok', summary: makeSummary() }),
    });
    expect(ui.getInitialState().state).toBe('idle');
  });
});

describe('createMobileFinancialsDashboardUi — loadFinancials', () => {
  it('returns loaded state with summary on success', async () => {
    const summary = makeSummary();
    const ui = createMobileFinancialsDashboardUi({
      financialsClient: makeClient({ ok: true, status: 'ok', summary }),
    });

    const state = await ui.loadFinancials('shelter-1');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.summary.shelterId).toBe('shelter-1');
      expect(state.summary.currency).toBe('EUR');
      expect(state.summary.donations.paidTotalCents).toBe(50000);
      expect(state.summary.sponsorships.activeCount).toBe(2);
    }
  });

  it('returns forbidden state on forbidden result', async () => {
    const ui = createMobileFinancialsDashboardUi({
      financialsClient: makeClient({
        ok: false,
        status: 'forbidden',
        reasons: ['not_a_member'],
      }),
    });

    const state = await ui.loadFinancials('shelter-1');

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state on worker_request_failed', async () => {
    const ui = createMobileFinancialsDashboardUi({
      financialsClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadFinancials('shelter-1');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
      expect(state.reasons).toHaveLength(1);
    }
  });

  it('returns failed state on unauthenticated', async () => {
    const ui = createMobileFinancialsDashboardUi({
      financialsClient: makeClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadFinancials('shelter-1');

    expect(state.state).toBe('failed');
  });

  it('sanitizes reasons — does not leak service-role or bearer in failed state', async () => {
    const ui = createMobileFinancialsDashboardUi({
      financialsClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.loadFinancials('shelter-1');
    const serialized = JSON.stringify(state);

    expect(state.state).toBe('failed');
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer abc123');
  });
});

describe('mobile foundation content', () => {
  it('exposes financialsDashboard entry with product-flow-ready status', () => {
    expect(mobileFoundationContent.financialsDashboard.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.financialsDashboard.title).toBeTruthy();
  });

  it('financialsDashboard entry does not expose credentials', () => {
    expect(JSON.stringify(mobileFoundationContent.financialsDashboard)).not.toContain('service-role');
    expect(JSON.stringify(mobileFoundationContent.financialsDashboard)).not.toContain('bearer ');
  });
});
