import { describe, expect, it } from 'vitest';
import {
  createMobileSponsorshipDonorListUi,
  mobileSponsorshipDonorListUiContent,
} from '../../apps/mobile/src/sponsorship-donor-list';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  SponsorshipDonorListClient,
  SponsorshipDonorListClientResult,
  SponsorshipListItem,
} from '../../packages/client/src/index';

const makeDonorListClient = (
  result: SponsorshipDonorListClientResult,
): Pick<SponsorshipDonorListClient, 'loadDonorSponsorships'> => ({
  loadDonorSponsorships: async () => result,
});

const sampleSponsorships: SponsorshipListItem[] = [
  {
    sponsorshipId: 'spons-001',
    amountCents: 1500,
    currency: 'EUR',
    paymentMethod: 'mb_way',
    recurringInterval: 'monthly',
    status: 'active',
    petId: 'pet-a',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
];

describe('mobile sponsorship donor list UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobileSponsorshipDonorListUi({
      sponsorshipDonorListClient: {
        loadDonorSponsorships: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileSponsorshipDonorListUiContent.locale).toBe('pt-PT');
    expect(mobileSponsorshipDonorListUiContent.status).toBe('product-flow-ready');
  });

  it('mobileSponsorshipDonorListUiContent has exactly 5 states (no forbidden)', () => {
    const stateNames = mobileSponsorshipDonorListUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loading');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('empty');
    expect(stateNames).toContain('failed');
    expect(stateNames).not.toContain('forbidden');
    expect(stateNames).toHaveLength(5);
  });

  it('loadDonorSponsorships success with items returns loaded state', async () => {
    const ui = createMobileSponsorshipDonorListUi({
      sponsorshipDonorListClient: makeDonorListClient({
        ok: true,
        status: 'ok',
        sponsorships: sampleSponsorships,
        total: 1,
      }),
    });

    const state = await ui.loadDonorSponsorships();

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.sponsorships).toHaveLength(1);
      expect(state.sponsorships[0]?.sponsorshipId).toBe('spons-001');
      expect(state.total).toBe(1);
    }
  });

  it('loadDonorSponsorships success with empty array returns empty state', async () => {
    const ui = createMobileSponsorshipDonorListUi({
      sponsorshipDonorListClient: makeDonorListClient({
        ok: true,
        status: 'ok',
        sponsorships: [],
        total: 0,
      }),
    });

    const state = await ui.loadDonorSponsorships();

    expect(state.state).toBe('empty');
  });

  it('loadDonorSponsorships worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobileSponsorshipDonorListUi({
      sponsorshipDonorListClient: makeDonorListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadDonorSponsorships();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('loadDonorSponsorships unauthenticated returns failed state', async () => {
    const ui = createMobileSponsorshipDonorListUi({
      sponsorshipDonorListClient: makeDonorListClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadDonorSponsorships();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileSponsorshipDonorListUi({
      sponsorshipDonorListClient: makeDonorListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.loadDonorSponsorships();
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('mobileSponsorshipDonorListUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobileSponsorshipDonorListUiContent.locale).toBe('pt-PT');
    expect(mobileSponsorshipDonorListUiContent.status).toBe('product-flow-ready');
    expect(mobileSponsorshipDonorListUiContent.title).toBeTruthy();
    expect(mobileSponsorshipDonorListUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes sponsorshipDonorList with product-flow-ready status', () => {
    expect(mobileFoundationContent.sponsorshipDonorList.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.sponsorshipDonorList.title).toBeTruthy();
    expect(mobileFoundationContent.sponsorshipDonorList.description).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.sponsorshipDonorList)).not.toContain('service-role');
  });

  it('loadDonorSponsorships passes query through to client', async () => {
    let capturedQuery: unknown;
    const ui = createMobileSponsorshipDonorListUi({
      sponsorshipDonorListClient: {
        loadDonorSponsorships: async (q) => {
          capturedQuery = q;
          return { ok: true, status: 'ok', sponsorships: [], total: 0 };
        },
      },
    });

    await ui.loadDonorSponsorships({ limit: 5, offset: 10 });

    expect(capturedQuery).toEqual({ limit: 5, offset: 10 });
  });
});
