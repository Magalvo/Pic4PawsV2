import { describe, it, expect } from 'vitest';
import { createMobileSponsorshipDonorListUi } from '../../apps/mobile/src/sponsorship-donor-list';
import type {
  SponsorshipDonorListClient,
  SponsorshipDonorListClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: SponsorshipDonorListClientResult,
): Pick<SponsorshipDonorListClient, 'loadDonorSponsorships'> => ({
  loadDonorSponsorships: async () => result,
});

const item = {
  sponsorshipId: 'sp-001',
  amountCents: 1000,
  currency: 'EUR',
  paymentMethod: 'mb_way' as const,
  recurringInterval: 'monthly' as const,
  status: 'active' as const,
  petId: null,
  createdAt: '2026-06-18T00:00:00.000Z',
};

describe('mobile sponsorship donor list screen — boundary contract', () => {
  it('produces loaded state when sponsorships exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [item], total: 1 });
    const ui = createMobileSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes sponsorships array and total', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [item], total: 1 });
    const ui = createMobileSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    if (result.state === 'loaded') {
      expect(result.sponsorships).toHaveLength(1);
      expect(result.sponsorships[0]?.sponsorshipId).toBe('sp-001');
      expect(result.total).toBe(1);
    }
  });

  it('produces empty state when no sponsorships', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [], total: 0 });
    const ui = createMobileSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    expect(result.state).toBe('empty');
  });

  it('produces failed state with canRetry on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [], total: 0 });
    const ui = createMobileSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createMobileSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
