import { describe, expect, it } from 'vitest';
import {
  createWebSponsorshipDonorListUi,
  webSponsorshipDonorListUiContent,
} from '../../apps/web/src/sponsorship-donor-list';
import { webFoundationContent } from '../../apps/web/src/foundation';
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

describe('web sponsorship donor list UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebSponsorshipDonorListUi({
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
    expect(webSponsorshipDonorListUiContent.locale).toBe('pt-PT');
    expect(webSponsorshipDonorListUiContent.status).toBe('product-flow-ready');
  });

  it('webSponsorshipDonorListUiContent has exactly 5 states (no forbidden)', () => {
    const stateNames = webSponsorshipDonorListUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loading');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('empty');
    expect(stateNames).toContain('failed');
    expect(stateNames).not.toContain('forbidden');
    expect(stateNames).toHaveLength(5);
  });

  it('loadDonorSponsorships success with items returns loaded state', async () => {
    const ui = createWebSponsorshipDonorListUi({
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
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadDonorSponsorships success with empty array returns empty state', async () => {
    const ui = createWebSponsorshipDonorListUi({
      sponsorshipDonorListClient: makeDonorListClient({
        ok: true,
        status: 'ok',
        sponsorships: [],
        total: 0,
      }),
    });

    const state = await ui.loadDonorSponsorships();

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadDonorSponsorships worker_request_failed returns failed state with canRetry', async () => {
    const ui = createWebSponsorshipDonorListUi({
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
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadDonorSponsorships unauthenticated returns failed state', async () => {
    const ui = createWebSponsorshipDonorListUi({
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
    const ui = createWebSponsorshipDonorListUi({
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

  it('webSponsorshipDonorListUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(webSponsorshipDonorListUiContent.locale).toBe('pt-PT');
    expect(webSponsorshipDonorListUiContent.status).toBe('product-flow-ready');
    expect(webSponsorshipDonorListUiContent.title).toBeTruthy();
    expect(webSponsorshipDonorListUiContent.description).toBeTruthy();
  });

  it('web foundation content exposes sponsorshipDonorList with product-flow-ready status', () => {
    expect(webFoundationContent.sponsorshipDonorList.status).toBe('product-flow-ready');
    expect(webFoundationContent.sponsorshipDonorList.title).toBeTruthy();
    expect(webFoundationContent.sponsorshipDonorList.description).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.sponsorshipDonorList)).not.toContain('service-role');
  });

  it('loadDonorSponsorships passes query params through to client', async () => {
    let capturedQuery: unknown;
    const ui = createWebSponsorshipDonorListUi({
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
