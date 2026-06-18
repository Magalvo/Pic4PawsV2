import { describe, it, expect } from 'vitest';
import { createMobileSponsorshipListUi } from '../../apps/mobile/src/sponsorship-list';
import type {
  SponsorshipListClient,
  SponsorshipListClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: SponsorshipListClientResult,
): Pick<SponsorshipListClient, 'loadSponsorships'> => ({
  loadSponsorships: async () => result,
});

const item = {
  sponsorshipId: 'sp-001',
  amountCents: 500,
  currency: 'EUR',
  paymentMethod: 'card' as const,
  recurringInterval: 'monthly' as const,
  status: 'active' as const,
  petId: null,
  createdAt: '2026-06-18T00:00:00.000Z',
};

describe('mobile sponsorship list screen — boundary contract', () => {
  it('produces loaded state when sponsorships exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [item], total: 1 });
    const ui = createMobileSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes sponsorships and total', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [item], total: 1 });
    const ui = createMobileSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    if (result.state === 'loaded') {
      expect(result.sponsorships).toHaveLength(1);
      expect(result.total).toBe(1);
    }
  });

  it('produces empty state when no sponsorships', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [], total: 0 });
    const ui = createMobileSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    expect(result.state).toBe('empty');
  });

  it('produces forbidden state', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state with canRetry on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [], total: 0 });
    const ui = createMobileSponsorshipListUi({ sponsorshipListClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });
});
