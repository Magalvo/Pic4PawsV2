import { describe, it, expect } from 'vitest';
import { createWebFinancialsDashboardUi } from '../../apps/web/src/financials';
import type { FinancialsClient, LoadFinancialsClientResult } from '@pic4paws/client';

const makeClient = (
  result: LoadFinancialsClientResult,
): Pick<FinancialsClient, 'loadFinancials'> => ({
  loadFinancials: async () => result,
});

const summary = {
  shelterId: 'shelter-001',
  currency: 'EUR',
  donations: { count: 2, paidTotalCents: 5000, byStatus: [] },
  sponsorships: { activeCount: 1, pausedCount: 0, cancelledCount: 0, activeTotalCents: 1000 },
};

describe('web financials page — boundary contract', () => {
  it('produces loaded state with summary', async () => {
    const client = makeClient({ ok: true, status: 'ok', summary });
    const ui = createWebFinancialsDashboardUi({ financialsClient: client });
    const result = await ui.loadFinancials('shelter-001');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') expect(result.summary.currency).toBe('EUR');
  });

  it('produces forbidden state', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createWebFinancialsDashboardUi({ financialsClient: client });
    const result = await ui.loadFinancials('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebFinancialsDashboardUi({ financialsClient: client });
    const result = await ui.loadFinancials('shelter-001');
    expect(result.state).toBe('failed');
  });
});
