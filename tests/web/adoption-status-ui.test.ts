import { describe, expect, it } from 'vitest';
import {
  createWebAdoptionStatusUi,
  webAdoptionStatusUiContent,
} from '../../apps/web/src/adoption-status';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  AdoptionStatusClient,
  AdoptionStatusClientResult,
} from '../../packages/client/src/index';

const makeAdoptionStatusClient = (
  result: AdoptionStatusClientResult,
): Pick<AdoptionStatusClient, 'manageAdoptionStatus'> => ({
  manageAdoptionStatus: async () => result,
});

describe('web adoption status UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebAdoptionStatusUi({
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
    expect(webAdoptionStatusUiContent.locale).toBe('pt-PT');
    expect(webAdoptionStatusUiContent.status).toBe('product-flow-ready');
  });

  it('webAdoptionStatusUiContent has all 4 required states', () => {
    const stateNames = webAdoptionStatusUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('succeeded');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(4);
  });

  it('manageAdoptionStatus success returns succeeded state with applicationId and newStatus', async () => {
    const ui = createWebAdoptionStatusUi({
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
    const ui = createWebAdoptionStatusUi({
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

  it('manageAdoptionStatus success with under_review status returns succeeded', async () => {
    const ui = createWebAdoptionStatusUi({
      adoptionStatusClient: makeAdoptionStatusClient({
        ok: true,
        status: 'ok',
        applicationId: 'app-003',
        newStatus: 'under_review',
      }),
    });

    const state = await ui.manageAdoptionStatus('app-003', 'under_review');

    expect(state.state).toBe('succeeded');
    if (state.state === 'succeeded') {
      expect(state.newStatus).toBe('under_review');
    }
  });

  it('manageAdoptionStatus worker_request_failed returns failed state with canRetry', async () => {
    const ui = createWebAdoptionStatusUi({
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
    const ui = createWebAdoptionStatusUi({
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
    const ui = createWebAdoptionStatusUi({
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
    const ui = createWebAdoptionStatusUi({
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

  it('webAdoptionStatusUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(webAdoptionStatusUiContent.locale).toBe('pt-PT');
    expect(webAdoptionStatusUiContent.status).toBe('product-flow-ready');
    expect(webAdoptionStatusUiContent.title).toBeTruthy();
    expect(webAdoptionStatusUiContent.description).toBeTruthy();
  });

  it('web foundation content exposes adoptionStatus with product-flow-ready status', () => {
    expect(webFoundationContent.adoptionStatus.status).toBe('product-flow-ready');
    expect(webFoundationContent.adoptionStatus.title).toBeTruthy();
    expect(webFoundationContent.adoptionStatus.description).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.adoptionStatus)).not.toContain('service-role');
  });
});
