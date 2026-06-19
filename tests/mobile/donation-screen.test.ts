import { describe, it, expect } from 'vitest';
import { createMobileDonationUi } from '../../apps/mobile/src/donation';
import type {
  DonationClient,
  DonationClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: DonationClientResult,
): Pick<DonationClient, 'submitDonation'> => ({
  submitDonation: async () => result,
});

const validInput = {
  shelterId: 'shelter-001',
  amountCents: 1000,
  kind: 'one_time_donation' as const,
  paymentMethod: 'mb_way' as const,
  dataProcessingAccepted: true as const,
};

describe('donation screen — boundary contract', () => {
  it('produces submitted state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'donation_created',
      donationId: 'don-001',
      amountCents: 1000,
      currency: 'EUR',
      kind: 'one_time_donation',
      shelterId: 'shelter-001',
      createdAt: '2026-06-18T00:00:00.000Z',
    });
    const ui = createMobileDonationUi({ donationClient: client });
    const result = await ui.submitDonation(validInput);
    expect(result.state).toBe('submitted');
  });

  it('submitted state includes donation details', async () => {
    const client = makeClient({
      ok: true,
      status: 'donation_created',
      donationId: 'don-001',
      amountCents: 2500,
      currency: 'EUR',
      kind: 'monthly_sponsorship',
      shelterId: 'shelter-001',
      createdAt: '2026-06-18T00:00:00.000Z',
    });
    const ui = createMobileDonationUi({ donationClient: client });
    const result = await ui.submitDonation({ ...validInput, amountCents: 2500, kind: 'monthly_sponsorship' });
    if (result.state === 'submitted') {
      expect(result.amountCents).toBe(2500);
      expect(result.donationId).toBe('don-001');
    }
  });

  it('produces failed state with unauthenticated status', async () => {
    const client = makeClient({
      ok: false,
      status: 'unauthenticated',
      reasons: [],
    });
    const ui = createMobileDonationUi({ donationClient: client });
    const result = await ui.submitDonation(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('produces failed state with invalid_donation status', async () => {
    const client = makeClient({
      ok: false,
      status: 'invalid_donation',
      reasons: ['amount_too_low'],
    });
    const ui = createMobileDonationUi({ donationClient: client });
    const result = await ui.submitDonation(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('invalid_donation');
    }
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
    const ui = createMobileDonationUi({ donationClient: client });
    const result = await ui.submitDonation(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('getInitialState returns idle state with PT-PT copy', () => {
    const client = makeClient({
      ok: true,
      status: 'donation_created',
      donationId: 'don-001',
      amountCents: 1000,
      currency: 'EUR',
      kind: 'one_time_donation',
      shelterId: 'shelter-001',
      createdAt: '2026-06-18T00:00:00.000Z',
    });
    const ui = createMobileDonationUi({ donationClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
  });

  it('passes all input fields to the client', async () => {
    const seen: typeof validInput[] = [];
    const trackingClient: Pick<DonationClient, 'submitDonation'> = {
      submitDonation: async (input) => {
        seen.push(input as typeof validInput);
        return {
          ok: true,
          status: 'donation_created',
          donationId: 'don-001',
          amountCents: 1000,
          currency: 'EUR',
          kind: 'one_time_donation',
          shelterId: 'shelter-001',
          createdAt: '2026-06-18T00:00:00.000Z',
        };
      },
    };
    const ui = createMobileDonationUi({ donationClient: trackingClient });
    await ui.submitDonation(validInput);
    expect(seen[0]?.shelterId).toBe('shelter-001');
    expect(seen[0]?.amountCents).toBe(1000);
    expect(seen[0]?.kind).toBe('one_time_donation');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createMobileDonationUi({ donationClient: client });
    const result = await ui.submitDonation(validInput);
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
