import { describe, it, expect } from 'vitest';
import { createWebSponsorshipDonorListUi } from '../../apps/web/src/sponsorship-donor-list';
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

describe('web sponsorship donor list page — boundary contract', () => {
  it('produces loaded state when sponsorships exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [item], total: 1 });
    const ui = createWebSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    expect(result.state).toBe('loaded');
  });

  it('produces empty state when no sponsorships', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [], total: 0 });
    const ui = createWebSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    expect(result.state).toBe('empty');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebSponsorshipDonorListUi({ sponsorshipDonorListClient: client });
    const result = await ui.loadDonorSponsorships();
    expect(result.state).toBe('failed');
  });
});
