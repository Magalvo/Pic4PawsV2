import { describe, it, expect } from 'vitest';
import { createMobileDonationListUi } from '../../apps/mobile/src/donation-list';
import type { DonationListClient, DonationListClientResult } from '@pic4paws/client';

const makeClient = (
  result: DonationListClientResult,
): Pick<DonationListClient, 'loadDonations'> => ({
  loadDonations: async () => result,
});

const donation = {
  donationId: 'don-001',
  kind: 'one_time_donation' as const,
  status: 'paid' as const,
  amountCents: 2000,
  currency: 'EUR',
  paymentMethod: 'mb_way' as const,
  anonymous: false,
  donorDisplayName: 'João Silva',
  publicMessage: null,
  createdAt: '2026-06-18T00:00:00.000Z',
};

describe('donation list screen — boundary contract', () => {
  it('produces loaded state when donations exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', donations: [donation], total: 1 });
    const ui = createMobileDonationListUi({ donationListClient: client });
    const result = await ui.loadDonations('shelter-001');
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes donations and total', async () => {
    const client = makeClient({ ok: true, status: 'ok', donations: [donation], total: 1 });
    const ui = createMobileDonationListUi({ donationListClient: client });
    const result = await ui.loadDonations('shelter-001');
    if (result.state === 'loaded') {
      expect(result.donations).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.donations[0]?.amountCents).toBe(2000);
    }
  });

  it('produces empty state when no donations', async () => {
    const client = makeClient({ ok: true, status: 'ok', donations: [], total: 0 });
    const ui = createMobileDonationListUi({ donationListClient: client });
    const result = await ui.loadDonations('shelter-001');
    expect(result.state).toBe('empty');
  });

  it('produces forbidden state on access denial', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileDonationListUi({ donationListClient: client });
    const result = await ui.loadDonations('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileDonationListUi({ donationListClient: client });
    const result = await ui.loadDonations('shelter-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle with PT-PT copy', () => {
    const client = makeClient({ ok: true, status: 'ok', donations: [], total: 0 });
    const ui = createMobileDonationListUi({ donationListClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createMobileDonationListUi({ donationListClient: client });
    const result = await ui.loadDonations('shelter-001');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
