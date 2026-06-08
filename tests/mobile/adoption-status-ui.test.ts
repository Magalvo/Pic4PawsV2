import { describe, expect, it } from 'vitest';
import {
  createMobileAdoptionStatusUi,
  mobileAdoptionStatusUiContent,
} from '../../apps/mobile/src/adoption-status';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  AdoptionStatusClient,
  AdoptionStatusClientResult,
} from '../../packages/client/src/index';

const makeAdoptionStatusClient = (
  result: AdoptionStatusClientResult,
): Pick<AdoptionStatusClient, 'manageAdoptionStatus'> => ({
  manageAdoptionStatus: async () => result,
});

describe('mobile adoption status UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: {
        manageAdoptionStatus: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileAdoptionStatusUiContent.locale).toBe('pt-PT');
    expect(mobileAdoptionStatusUiContent.status).toBe('product-flow-ready');
  });

  it('mobileAdoptionStatusUiContent has all 4 required states', () => {
    const stateNames = mobileAdoptionStatusUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('succeeded');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(4);
  });

  it('manageAdoptionStatus success returns succeeded state with applicationId and newStatus', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: true,
        status: 'ok',
        applicationId: 'app-001',
        newStatus: 'approved',
      }),
    });

    const state = await ui.manageAdoptionStatus('app-001', 'approved');

    expect(state.state).toBe('succeeded');
    if (state.state === 'succeeded') {
      expect(state.applicationId).toBe('app-001');
      expect(state.newStatus).toBe('approved');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('manageAdoptionStatus success with rejected status returns succeeded', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: true,
        status: 'ok',
        applicationId: 'app-002',
        newStatus: 'rejected',
      }),
    });

    const state = await ui.manageAdoptionStatus('app-002', 'rejected');

    expect(state.state).toBe('succeeded');
    if (state.state === 'succeeded') {
      expect(state.newStatus).toBe('rejected');
    }
  });

  it('manageAdoptionStatus success with more_info_requested status returns succeeded', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: true,
        status: 'ok',
        applicationId: 'app-003',
        newStatus: 'more_info_requested',
      }),
    });

    const state = await ui.manageAdoptionStatus('app-003', 'more_info_requested');

    expect(state.state).toBe('succeeded');
    if (state.state === 'succeeded') {
      expect(state.newStatus).toBe('more_info_requested');
    }
  });

  it('manageAdoptionStatus worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.manageAdoptionStatus('app-001', 'approved');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('manageAdoptionStatus forbidden returns failed state', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.manageAdoptionStatus('app-001', 'approved');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('forbidden');
    }
  });

  it('manageAdoptionStatus adoption_not_found returns failed state', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: false,
        status: 'adoption_not_found',
        reasons: ['adoption_not_found'],
      }),
    });

    const state = await ui.manageAdoptionStatus('app-001', 'approved');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('adoption_not_found');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.manageAdoptionStatus('app-001', 'approved');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('mobileAdoptionStatusUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobileAdoptionStatusUiContent.locale).toBe('pt-PT');
    expect(mobileAdoptionStatusUiContent.status).toBe('product-flow-ready');
    expect(mobileAdoptionStatusUiContent.title).toBeTruthy();
    expect(mobileAdoptionStatusUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes adoptionStatus with product-flow-ready status', () => {
    expect(mobileFoundationContent.adoptionStatus.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.adoptionStatus.title).toBeTruthy();
    expect(mobileFoundationContent.adoptionStatus.description).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.adoptionStatus)).not.toContain('service-role');
  });

  it('manageAdoptionStatus unauthenticated returns failed state', async () => {
    const ui = createMobileAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['unauthenticated'],
      }),
    });

    const state = await ui.manageAdoptionStatus('app-001', 'approved');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
      expect(state.canRetry).toBe(true);
    }
  });
});
