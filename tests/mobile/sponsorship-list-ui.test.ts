import { describe, expect, it } from 'vitest';
import {
  createMobileSponsorshipListUi,
  mobileSponsorshipListUiContent,
} from '../../apps/mobile/src/sponsorship-list';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  SponsorshipListClient,
  SponsorshipListItem,
  SponsorshipListClientResult,
} from '../../packages/client/src/index';

const makeSponsorshipListClient = (
  result: SponsorshipListClientResult,
): Pick<SponsorshipListClient, 'loadSponsorships'> => ({
  loadSponsorships: async () => result,
});

const sampleSponsorship: SponsorshipListItem = {
  sponsorshipId: 'sponsorship-001',
  amountCents: 1000,
  currency: 'EUR',
  paymentMethod: 'mb_way',
  recurringInterval: 'monthly',
  status: 'active',
  petId: null,
  createdAt: '2026-06-08T10:00:00.000Z',
};

describe('mobile sponsorship list UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobileSponsorshipListUi({
      sponsorshipListClient: {
        loadSponsorships: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileSponsorshipListUiContent.locale).toBe('pt-PT');
    expect(mobileSponsorshipListUiContent.status).toBe('product-flow-ready');
  });

  it('mobileSponsorshipListUiContent has all 6 required states', () => {
    const stateNames = mobileSponsorshipListUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loading');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('empty');
    expect(stateNames).toContain('forbidden');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(6);
  });

  it('loadSponsorships with non-empty result returns loaded state with sponsorships and total', async () => {
    const ui = createMobileSponsorshipListUi({
      sponsorshipListClient: makeSponsorshipListClient({
        ok: true,
        status: 'ok',
        sponsorships: [sampleSponsorship],
        total: 1,
      }),
    });

    const state = await ui.loadSponsorships('shelter-a');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.sponsorships).toHaveLength(1);
      expect(state.sponsorships[0]?.sponsorshipId).toBe('sponsorship-001');
      expect(state.total).toBe(1);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadSponsorships with empty result returns empty state', async () => {
    const ui = createMobileSponsorshipListUi({
      sponsorshipListClient: makeSponsorshipListClient({
        ok: true,
        status: 'ok',
        sponsorships: [],
        total: 0,
      }),
    });

    const state = await ui.loadSponsorships('shelter-a');

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadSponsorships forbidden returns dedicated forbidden state (not failed)', async () => {
    const ui = createMobileSponsorshipListUi({
      sponsorshipListClient: makeSponsorshipListClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.loadSponsorships('shelter-a');

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadSponsorships worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobileSponsorshipListUi({
      sponsorshipListClient: makeSponsorshipListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadSponsorships('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadSponsorships unauthenticated returns failed state', async () => {
    const ui = createMobileSponsorshipListUi({
      sponsorshipListClient: makeSponsorshipListClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadSponsorships('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileSponsorshipListUi({
      sponsorshipListClient: makeSponsorshipListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key', 'bearer abc123'],
      }),
    });

    const state = await ui.loadSponsorships('shelter-a');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('mobileSponsorshipListUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobileSponsorshipListUiContent.locale).toBe('pt-PT');
    expect(mobileSponsorshipListUiContent.status).toBe('product-flow-ready');
    expect(mobileSponsorshipListUiContent.title).toBeTruthy();
    expect(mobileSponsorshipListUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes sponsorshipList with product-flow-ready status', () => {
    expect(mobileFoundationContent.sponsorshipList.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.sponsorshipList.title).toBeTruthy();
    expect(mobileFoundationContent.sponsorshipList.description).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.sponsorshipList)).not.toContain('service-role');
  });
});
