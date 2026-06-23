import { describe, it, expect } from 'vitest';
import { createWebDonationUi } from '../../apps/web/src/donation';
import type { DonationClient, DonationClientInput, DonationClientResult } from '@pic4paws/client';

const makeClient = (
  result: DonationClientResult,
): Pick<DonationClient, 'submitDonation'> => ({
  submitDonation: async () => result,
});

const validInput: DonationClientInput = {
  shelterId: 'shelter-abc',
  amountCents: 1000,
  kind: 'one_time_donation',
  paymentMethod: 'mb_way',
  dataProcessingAccepted: true,
};

describe('donation page — boundary contract', () => {
  it('produces failed state when client returns unauthenticated', async () => {
    const client = makeClient({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    const ui = createWebDonationUi({ donationClient: client });
    const result = await ui.submitDonation(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces submitted state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'donation_created',
      donationId: 'don-xyz',
      amountCents: 1000,
      currency: 'EUR',
      kind: 'one_time_donation',
      shelterId: 'shelter-abc',
      createdAt: '2026-06-14T00:00:00.000Z',
      tier: 'manual',
      iban: 'PT50000201231234567890154',
      mbWayPhone: null,
    });
    const ui = createWebDonationUi({ donationClient: client });
    const result = await ui.submitDonation(validInput);
    expect(result.state).toBe('submitted');
    if (result.state === 'submitted') {
      expect(result.donationId).toBe('don-xyz');
      expect(result.amountCents).toBe(1000);
    }
  });

  it('passes shelterId from input to the client', async () => {
    const seen: string[] = [];
    const trackingClient: Pick<DonationClient, 'submitDonation'> = {
      submitDonation: async (input) => {
        seen.push(input.shelterId);
        return { ok: false, status: 'unauthenticated', reasons: [] };
      },
    };
    const ui = createWebDonationUi({ donationClient: trackingClient });
    await ui.submitDonation({ ...validInput, shelterId: 'shelter-target-001' });
    expect(seen).toEqual(['shelter-target-001']);
  });
});
