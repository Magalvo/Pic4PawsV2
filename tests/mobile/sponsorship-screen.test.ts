import { describe, it, expect } from 'vitest';
import { createMobileSponsorshipUi } from '../../apps/mobile/src/sponsorship';
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
};

describe('mobile sponsorship screen — boundary contract', () => {
  it('produces submitted state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'sponsorship_created',
      sponsorshipId: 'sp-001',
      amountCents: 1000,
    });
    const ui = createMobileSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    expect(result.state).toBe('submitted');
  });

  it('submitted state includes sponsorshipId and amountCents', async () => {
    const client = makeClient({
      ok: true,
      status: 'sponsorship_created',
      sponsorshipId: 'sp-001',
      amountCents: 1000,
    });
    const ui = createMobileSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    if (result.state === 'submitted') {
      expect(result.sponsorshipId).toBe('sp-001');
      expect(result.amountCents).toBe(1000);
    }
  });

  it('produces failed state on forbidden', async () => {
    const client = makeClient({ ok: false, status: 'unauthenticated', reasons: [] });
    const ui = createMobileSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    expect(result.state).toBe('failed');
  });

  it('produces failed state with canRetry on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileSponsorshipUi({ sponsorshipClient: client });
    const result = await ui.submitSponsorship(input);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileSponsorshipUi({ sponsorshipClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });
});
