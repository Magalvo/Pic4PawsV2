import { describe, expect, it } from 'vitest';
import {
  createWebDonationListUi,
  webDonationListUiContent,
} from '../../apps/web/src/donation-list';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  DonationListClient,
  DonationListApplication,
  DonationListClientResult,
} from '../../packages/client/src/index';

const makeDonationListClient = (
  result: DonationListClientResult,
): Pick<DonationListClient, 'loadDonations'> => ({
  loadDonations: async () => result,
});

const sampleDonation: DonationListApplication = {
  donationId: 'donation-001',
  kind: 'one_time_donation',
  status: 'paid',
  amountCents: 1000,
  currency: 'EUR',
  paymentMethod: 'mb_way',
  anonymous: false,
  donorDisplayName: 'João Silva',
  publicMessage: 'Força abrigo!',
  createdAt: '2026-06-08T10:00:00.000Z',
};

describe('web donation list UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebDonationListUi({
      donationListClient: {
        loadDonations: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(webDonationListUiContent.locale).toBe('pt-PT');
    expect(webDonationListUiContent.status).toBe('product-flow-ready');
  });

  it('webDonationListUiContent has all 6 required states', () => {
    const stateNames = webDonationListUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loading');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('empty');
    expect(stateNames).toContain('forbidden');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(6);
  });

  it('loadDonations with non-empty result returns loaded state with donations and total', async () => {
    const ui = createWebDonationListUi({
      donationListClient: makeDonationListClient({
        ok: true,
        status: 'ok',
        donations: [sampleDonation],
        total: 1,
      }),
    });

    const state = await ui.loadDonations('shelter-a');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.donations).toHaveLength(1);
      expect(state.donations[0]?.donationId).toBe('donation-001');
      expect(state.total).toBe(1);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadDonations with empty result returns empty state', async () => {
    const ui = createWebDonationListUi({
      donationListClient: makeDonationListClient({
        ok: true,
        status: 'ok',
        donations: [],
        total: 0,
      }),
    });

    const state = await ui.loadDonations('shelter-a');

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadDonations forbidden returns dedicated forbidden state (not failed)', async () => {
    const ui = createWebDonationListUi({
      donationListClient: makeDonationListClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.loadDonations('shelter-a');

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadDonations worker_request_failed returns failed state with canRetry', async () => {
    const ui = createWebDonationListUi({
      donationListClient: makeDonationListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadDonations('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadDonations unauthenticated returns failed state', async () => {
    const ui = createWebDonationListUi({
      donationListClient: makeDonationListClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadDonations('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createWebDonationListUi({
      donationListClient: makeDonationListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key', 'bearer abc123'],
      }),
    });

    const state = await ui.loadDonations('shelter-a');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('webDonationListUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(webDonationListUiContent.locale).toBe('pt-PT');
    expect(webDonationListUiContent.status).toBe('product-flow-ready');
    expect(webDonationListUiContent.title).toBeTruthy();
    expect(webDonationListUiContent.description).toBeTruthy();
  });

  it('web foundation content exposes donationList with product-flow-ready status', () => {
    expect(webFoundationContent.donationList.status).toBe('product-flow-ready');
    expect(webFoundationContent.donationList.title).toBeTruthy();
    expect(webFoundationContent.donationList.description).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.donationList)).not.toContain('service-role');
  });
});
