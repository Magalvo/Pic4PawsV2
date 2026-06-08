import { describe, expect, it } from 'vitest';
import {
  createMobileAdoptionViewUi,
  mobileAdoptionViewUiContent,
} from '../../apps/mobile/src/adoption-view';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  AdoptionViewClient,
  AdoptionViewClientResult,
} from '../../packages/client/src/index';

const makeAdoptionViewClient = (
  result: AdoptionViewClientResult,
): Pick<AdoptionViewClient, 'loadAdoptionView'> => ({
  loadAdoptionView: async () => result,
});

describe('mobile adoption view UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: {
        loadAdoptionView: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileAdoptionViewUiContent.locale).toBe('pt-PT');
    expect(mobileAdoptionViewUiContent.status).toBe('product-flow-ready');
  });

  it('mobileAdoptionViewUiContent has all 6 required states', () => {
    const stateNames = mobileAdoptionViewUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loading');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('not_found');
    expect(stateNames).toContain('forbidden');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(6);
  });

  it('loadAdoptionView success returns loaded state with application', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: true,
        status: 'ok',
        application: {
          applicationId: 'app-001',
          applicationStatus: 'submitted',
          shelterId: 'shelter-001',
          petId: 'pet-001',
        },
      }),
    });

    const state = await ui.loadAdoptionView('app-001');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.application.applicationId).toBe('app-001');
      expect(state.application.applicationStatus).toBe('submitted');
      expect(state.application.shelterId).toBe('shelter-001');
      expect(state.application.petId).toBe('pet-001');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadAdoptionView success with approved status and null petId returns loaded state', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: true,
        status: 'ok',
        application: {
          applicationId: 'app-002',
          applicationStatus: 'approved',
          shelterId: 'shelter-001',
          petId: null,
        },
      }),
    });

    const state = await ui.loadAdoptionView('app-002');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.application.applicationStatus).toBe('approved');
      expect(state.application.petId).toBeNull();
    }
  });

  it('loadAdoptionView adoption_not_found returns not_found state', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: false,
        status: 'adoption_not_found',
        reasons: ['adoption_not_found'],
      }),
    });

    const state = await ui.loadAdoptionView('app-404');

    expect(state.state).toBe('not_found');
    if (state.state === 'not_found') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadAdoptionView forbidden returns forbidden state', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.loadAdoptionView('app-001');

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadAdoptionView worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadAdoptionView('app-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadAdoptionView unauthenticated returns failed state', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadAdoptionView('app-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('loadAdoptionView adoption_view_repository_not_configured returns failed state', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: false,
        status: 'adoption_view_repository_not_configured',
        reasons: ['adoption_view_repository_not_configured'],
      }),
    });

    const state = await ui.loadAdoptionView('app-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('adoption_view_repository_not_configured');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileAdoptionViewUi({
      adoptionViewClient: makeAdoptionViewClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.loadAdoptionView('app-001');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('mobileAdoptionViewUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobileAdoptionViewUiContent.locale).toBe('pt-PT');
    expect(mobileAdoptionViewUiContent.status).toBe('product-flow-ready');
    expect(mobileAdoptionViewUiContent.title).toBeTruthy();
    expect(mobileAdoptionViewUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes adoptionView with product-flow-ready status', () => {
    expect(mobileFoundationContent.adoptionView.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.adoptionView.title).toBeTruthy();
    expect(mobileFoundationContent.adoptionView.description).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.adoptionView)).not.toContain('service-role');
  });
});
