import { describe, expect, it } from 'vitest';
import {
  createMobileAdoptionListUi,
  mobileAdoptionListUiContent,
} from '../../apps/mobile/src/adoption-list';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  AdoptionListClient,
  AdoptionListClientResult,
  AdoptionListApplication,
} from '../../packages/client/src/index';

const makeAdoptionListClient = (
  result: AdoptionListClientResult,
): Pick<AdoptionListClient, 'loadApplications'> => ({
  loadApplications: async () => result,
});

const sampleApplications: AdoptionListApplication[] = [
  {
    applicationId: 'app-001',
    petId: 'pet-pub-1',
    applicantUserId: 'user-adopter-1',
    applicantFullName: 'Maria Silva',
    applicantEmail: 'maria@example.pt',
    applicantCity: 'Lisboa',
    status: 'submitted',
    submittedAt: '2026-06-07T10:00:00.000Z',
  },
];

describe('mobile adoption list UI', () => {
  it('getInitialState returns idle state with PT-PT copy and content contract', () => {
    const ui = createMobileAdoptionListUi({
      adoptionListClient: {
        loadApplications: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileAdoptionListUiContent.locale).toBe('pt-PT');
    expect(mobileAdoptionListUiContent.status).toBe('product-flow-ready');
    expect(mobileAdoptionListUiContent.states.map((s) => s.state)).toEqual(
      expect.arrayContaining(['idle', 'loading', 'loaded', 'empty', 'forbidden', 'failed']),
    );
  });

  it('loadApplications with results returns loaded state with applications and total', async () => {
    const ui = createMobileAdoptionListUi({
      adoptionListClient: makeAdoptionListClient({
        ok: true,
        status: 'ok',
        applications: sampleApplications,
        total: 1,
      }),
    });

    const state = await ui.loadApplications('shelter-a');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.applications).toHaveLength(1);
      expect(state.total).toBe(1);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadApplications with empty result returns empty state', async () => {
    const ui = createMobileAdoptionListUi({
      adoptionListClient: makeAdoptionListClient({
        ok: true,
        status: 'ok',
        applications: [],
        total: 0,
      }),
    });

    const state = await ui.loadApplications('shelter-a');

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadApplications returns dedicated forbidden state when client returns forbidden', async () => {
    const ui = createMobileAdoptionListUi({
      adoptionListClient: makeAdoptionListClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.loadApplications('shelter-a');

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadApplications worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobileAdoptionListUi({
      adoptionListClient: makeAdoptionListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadApplications('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('loadApplications unauthenticated returns failed state', async () => {
    const ui = createMobileAdoptionListUi({
      adoptionListClient: makeAdoptionListClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadApplications('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileAdoptionListUi({
      adoptionListClient: makeAdoptionListClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
      }),
    });

    const state = await ui.loadApplications('shelter-a');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });

  it('mobile foundation content exposes adoptionList with product-flow-ready status', () => {
    expect(mobileFoundationContent.adoptionList.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.adoptionList.title).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.adoptionList)).not.toContain('service-role');
  });
});
