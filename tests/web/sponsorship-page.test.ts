import { describe, it, expect } from 'vitest';
import { createWebSponsorshipUi } from '../../apps/web/src/sponsorship';
import type { SponsorshipClient, SponsorshipClientResult, SponsorshipClientInput } from '@pic4paws/client';

const makeClient = (
  result: SponsorshipClientResult,
): Pick<SponsorshipClient, 'submitSponsorship'> => ({
  submitSponsorship: async () => result,
});

const input: SponsorshipClientInput = {
  shelterId: 'shelter-001',
  amountCents: 1000,
  paymentMethod: 'card',
  recurringInterval: 'monthly',
  dataProcessingAccepted: true,
};

describe('web sponsorship page — boundary contract', () => {
  it('produces submitted state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'sponsorship_created',
      sponsorshipId: 'sp-001',
      amountCents: 1000,
      currency: 'EUR',
      recurringInterval: 'monthly',
      shelterId: 'shelter-001',
      createdAt: '2026-01-01T00:00:00Z',
    });
    const ui = createWebSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    expect(result.state).toBe('submitted');
    if (result.state === 'submitted') expect(result.sponsorshipId).toBe('sp-001');
  });

  it('produces failed state on unauthenticated', async () => {
    const client = makeClient({ ok: false, status: 'unauthenticated', reasons: [] });
    const ui = createWebSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    expect(result.state).toBe('failed');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    expect(result.state).toBe('failed');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createWebSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
