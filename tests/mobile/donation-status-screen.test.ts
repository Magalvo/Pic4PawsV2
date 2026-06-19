import { describe, it, expect } from 'vitest';
import { createMobileDonationStatusUi } from '../../apps/mobile/src/donation-status';
import type {
  DonationStatusClient,
  DonationStatusClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: DonationStatusClientResult,
): Pick<DonationStatusClient, 'loadDonationStatus'> => ({
  loadDonationStatus: async () => result,
});

const successResult: DonationStatusClientResult = {
  ok: true,
  status: 'ok',
  donation: {
    donationId: 'don-001',
    kind: 'one_time_donation',
    donationStatus: 'paid',
    amountCents: 1500,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    shelterId: 'shelter-001',
    petId: null,
    createdAt: '2026-06-18T00:00:00.000Z',
  },
};

describe('donation status screen — boundary contract', () => {
  it('produces loaded state on success', async () => {
    const client = makeClient(successResult);
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('don-001');
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes donation details', async () => {
    const client = makeClient(successResult);
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('don-001');
    if (result.state === 'loaded') {
      expect(result.donation.donationId).toBe('don-001');
      expect(result.donation.amountCents).toBe(1500);
      expect(result.donation.donationStatus).toBe('paid');
    }
  });

  it('produces not_found state when donation is missing', async () => {
    const client = makeClient({ ok: false, status: 'donation_not_found', reasons: [] });
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('don-999');
    expect(result.state).toBe('not_found');
  });

  it('produces forbidden state when access is denied', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('don-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state with unauthenticated status', async () => {
    const client = makeClient({ ok: false, status: 'unauthenticated', reasons: [] });
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('don-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['network_error'] });
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('don-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('getInitialState returns idle state with PT-PT copy', () => {
    const client = makeClient(successResult);
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createMobileDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('don-001');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
