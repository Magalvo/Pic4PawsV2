import { describe, expect, it } from 'vitest';
import {
  createWebSponsorshipManageUi,
  webSponsorshipManageUiContent,
} from '../../apps/web/src/sponsorship-manage';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  SponsorshipManageClient,
  SponsorshipManageClientResult,
} from '../../packages/client/src/index';

const makeManageClient = (
  result: SponsorshipManageClientResult,
): Pick<SponsorshipManageClient, 'manageSponsorship'> => ({
  manageSponsorship: async () => result,
});

describe('web sponsorship manage UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebSponsorshipManageUi({
      sponsorshipManageClient: {
        manageSponsorship: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(webSponsorshipManageUiContent.locale).toBe('pt-PT');
    expect(webSponsorshipManageUiContent.status).toBe('product-flow-ready');
  });

  it('webSponsorshipManageUiContent has all 4 required states', () => {
    const stateNames = webSponsorshipManageUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('succeeded');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(4);
  });

  it('manageSponsorship success returns succeeded state with sponsorshipId and newStatus', async () => {
    const ui = createWebSponsorshipManageUi({
      sponsorshipManageClient: makeManageClient({
        ok: true,
        status: 'ok',
        sponsorshipId: 'spons-001',
        newStatus: 'paused',
      }),
    });

    const state = await ui.manageSponsorship('spons-001', 'paused');

    expect(state.state).toBe('succeeded');
    if (state.state === 'succeeded') {
      expect(state.sponsorshipId).toBe('spons-001');
      expect(state.newStatus).toBe('paused');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('manageSponsorship success with cancelled status returns succeeded', async () => {
    const ui = createWebSponsorshipManageUi({
      sponsorshipManageClient: makeManageClient({
        ok: true,
        status: 'ok',
        sponsorshipId: 'spons-002',
        newStatus: 'cancelled',
      }),
    });

    const state = await ui.manageSponsorship('spons-002', 'cancelled');

    expect(state.state).toBe('succeeded');
    if (state.state === 'succeeded') {
      expect(state.newStatus).toBe('cancelled');
    }
  });

  it('manageSponsorship worker_request_failed returns failed state with canRetry', async () => {
    const ui = createWebSponsorshipManageUi({
      sponsorshipManageClient: makeManageClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.manageSponsorship('spons-001', 'paused');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('manageSponsorship forbidden returns failed state', async () => {
    const ui = createWebSponsorshipManageUi({
      sponsorshipManageClient: makeManageClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.manageSponsorship('spons-001', 'paused');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('forbidden');
    }
  });

  it('manageSponsorship sponsorship_not_found returns failed state', async () => {
    const ui = createWebSponsorshipManageUi({
      sponsorshipManageClient: makeManageClient({
        ok: false,
        status: 'sponsorship_not_found',
        reasons: ['sponsorship_not_found'],
      }),
    });

    const state = await ui.manageSponsorship('spons-001', 'paused');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('sponsorship_not_found');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createWebSponsorshipManageUi({
      sponsorshipManageClient: makeManageClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.manageSponsorship('spons-001', 'paused');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('webSponsorshipManageUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(webSponsorshipManageUiContent.locale).toBe('pt-PT');
    expect(webSponsorshipManageUiContent.status).toBe('product-flow-ready');
    expect(webSponsorshipManageUiContent.title).toBeTruthy();
    expect(webSponsorshipManageUiContent.description).toBeTruthy();
  });

  it('web foundation content exposes sponsorshipManage with product-flow-ready status', () => {
    expect(webFoundationContent.sponsorshipManage.status).toBe('product-flow-ready');
    expect(webFoundationContent.sponsorshipManage.title).toBeTruthy();
    expect(webFoundationContent.sponsorshipManage.description).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.sponsorshipManage)).not.toContain('service-role');
  });
});
