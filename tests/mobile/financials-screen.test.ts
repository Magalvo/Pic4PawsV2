import { describe, it, expect } from 'vitest';
import { createMobileFinancialsDashboardUi } from '../../apps/mobile/src/financials';
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
  sponsorships: { activeCount: 1, monthlyTotalCents: 1000, byStatus: [] },
};

describe('mobile financials screen — boundary contract', () => {
  it('produces loaded state with summary', async () => {
    const client = makeClient({ ok: true, status: 'ok', summary });
    const ui = createMobileFinancialsDashboardUi({ financialsClient: client });
    const result = await ui.loadFinancials('shelter-001');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') expect(result.summary.shelterId).toBe('shelter-001');
  });

  it('produces forbidden state', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileFinancialsDashboardUi({ financialsClient: client });
    const result = await ui.loadFinancials('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state with canRetry on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileFinancialsDashboardUi({ financialsClient: client });
    const result = await ui.loadFinancials('shelter-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'ok', summary });
    const ui = createMobileFinancialsDashboardUi({ financialsClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });
});
