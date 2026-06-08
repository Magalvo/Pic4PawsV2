import { describe, expect, it } from 'vitest';
import {
  createMobileDonationStatusUi,
  mobileDonationStatusUiContent,
} from '../../apps/mobile/src/donation-status';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  DonationStatusClient,
  DonationStatusClientResult,
} from '../../packages/client/src/index';

const makeClient = (result: DonationStatusClientResult): Pick<DonationStatusClient, 'loadDonationStatus'> => ({
  loadDonationStatus: async () => result,
});

const sampleDonation = {
  donationId: 'donation-abc',
  kind: 'one_time_donation' as const,
  donationStatus: 'paid' as const,
  amountCents: 1000,
  currency: 'EUR',
  paymentMethod: 'mb_way' as const,
  shelterId: 'shelter-001',
  petId: null,
  createdAt: '2026-06-08T12:00:00.000Z',
};

describe('mobile donation status UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobileDonationStatusUi({
      donationStatusClient: { loadDonationStatus: async () => { throw new Error('no call'); } },
    });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.primaryAction).toBeTruthy();
    expect(mobileDonationStatusUiContent.locale).toBe('pt-PT');
    expect(mobileDonationStatusUiContent.status).toBe('product-flow-ready');
  });

  it('mobileDonationStatusUiContent has all 6 required states', () => {
    const stateNames = mobileDonationStatusUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loading');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('not_found');
    expect(stateNames).toContain('forbidden');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(6);
  });

  it('loadDonationStatus ok returns loaded state with donation', async () => {
    const ui = createMobileDonationStatusUi({
      donationStatusClient: makeClient({ ok: true, status: 'ok', donation: sampleDonation }),
    });
    const state = await ui.loadDonationStatus('donation-abc');
    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.donation.donationId).toBe('donation-abc');
      expect(state.donation.donationStatus).toBe('paid');
    }
  });

  it('loadDonationStatus donation_not_found returns dedicated not_found state', async () => {
    const ui = createMobileDonationStatusUi({
      donationStatusClient: makeClient({ ok: false, status: 'donation_not_found', reasons: ['not_found'] }),
    });
    const state = await ui.loadDonationStatus('donation-abc');
    expect(state.state).toBe('not_found');
    if (state.state === 'not_found') expect(state.title).toBeTruthy();
  });

  it('loadDonationStatus forbidden returns dedicated forbidden state (not failed)', async () => {
    const ui = createMobileDonationStatusUi({
      donationStatusClient: makeClient({ ok: false, status: 'forbidden', reasons: ['forbidden'] }),
    });
    const state = await ui.loadDonationStatus('donation-abc');
    expect(state.state).toBe('forbidden');
  });

  it('loadDonationStatus worker_request_failed returns failed with canRetry', async () => {
    const ui = createMobileDonationStatusUi({
      donationStatusClient: makeClient({ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }),
    });
    const state = await ui.loadDonationStatus('donation-abc');
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileDonationStatusUi({
      donationStatusClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc'],
      }),
    });
    const state = await ui.loadDonationStatus('donation-abc');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc');
  });

  it('unauthenticated returns failed state', async () => {
    const ui = createMobileDonationStatusUi({
      donationStatusClient: makeClient({ ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] }),
    });
    const state = await ui.loadDonationStatus('donation-abc');
    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.status).toBe('unauthenticated');
  });

  it('mobile foundation content exposes donationStatus with product-flow-ready status', () => {
    expect(mobileFoundationContent.donationStatus.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.donationStatus.title).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.donationStatus)).not.toContain('service-role');
  });
});
