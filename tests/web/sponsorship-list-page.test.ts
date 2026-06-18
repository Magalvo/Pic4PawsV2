import { describe, it, expect } from 'vitest';
import { createWebSponsorshipListUi } from '../../apps/web/src/sponsorship-list';
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

describe('web sponsorship list page — boundary contract', () => {
  it('produces loaded state when sponsorships exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [item], total: 1 });
    const ui = createWebSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    expect(result.state).toBe('loaded');
  });

  it('produces empty state when no sponsorships', async () => {
    const client = makeClient({ ok: true, status: 'ok', sponsorships: [], total: 0 });
    const ui = createWebSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    expect(result.state).toBe('empty');
  });

  it('produces forbidden state', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createWebSponsorshipListUi({ sponsorshipListClient: client });
    const result = await ui.loadSponsorships('shelter-001');
    expect(result.state).toBe('forbidden');
  });
});
