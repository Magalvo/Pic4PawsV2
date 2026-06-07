import { describe, expect, it } from 'vitest';
import {
  createMobileShelterProfileUi,
  mobileShelterProfileUiContent,
} from '../../apps/mobile/src/shelter-profile';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  ShelterProfileClient,
  ShelterProfileClientResult,
} from '../../packages/client/src/index';

const makeShelterClient = (
  result: ShelterProfileClientResult,
): Pick<ShelterProfileClient, 'loadProfile'> => ({
  loadProfile: async () => result,
});

const sampleShelter = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter' as const,
  verificationStatus: 'verified' as const,
  publicEmail: 'contacto@abrigodosamigos.pt',
  publicPhone: '+351912345678',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  description: 'Um abrigo com coração.',
  logoMediaId: 'logo-media-1',
  coverMediaId: 'cover-media-1',
};

describe('mobile shelter profile UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobileShelterProfileUi({
      shelterProfileClient: {
        loadProfile: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileShelterProfileUiContent.locale).toBe('pt-PT');
    expect(mobileShelterProfileUiContent.status).toBe('product-flow-ready');
    expect(mobileShelterProfileUiContent.states.map((s) => s.state)).toEqual([
      'idle',
      'loading',
      'loaded',
      'not_found',
      'failed',
    ]);
  });

  it('loadProfile with a valid shelter returns loaded state with shelter data', async () => {
    const ui = createMobileShelterProfileUi({
      shelterProfileClient: makeShelterClient({
        ok: true,
        status: 'ok',
        shelter: sampleShelter,
      }),
    });

    const state = await ui.loadProfile('shelter-a');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.shelter).toEqual(sampleShelter);
      expect(state.title).toBeTruthy();
    }
  });

  it('loadProfile returns not_found state when client returns shelter_not_found', async () => {
    const ui = createMobileShelterProfileUi({
      shelterProfileClient: makeShelterClient({
        ok: false,
        status: 'shelter_not_found',
        reasons: ['shelter_not_found'],
      }),
    });

    const state = await ui.loadProfile('unknown-shelter');

    expect(state.state).toBe('not_found');
    if (state.state === 'not_found') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadProfile worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobileShelterProfileUi({
      shelterProfileClient: makeShelterClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadProfile('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('loadProfile worker_response_invalid returns failed state', async () => {
    const ui = createMobileShelterProfileUi({
      shelterProfileClient: makeShelterClient({
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      }),
    });

    const state = await ui.loadProfile('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_response_invalid');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileShelterProfileUi({
      shelterProfileClient: makeShelterClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
      }),
    });

    const state = await ui.loadProfile('shelter-a');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });

  it('mobileShelterProfileUiContent has pt-PT locale and all required states', () => {
    expect(mobileShelterProfileUiContent.locale).toBe('pt-PT');
    expect(mobileShelterProfileUiContent.status).toBe('product-flow-ready');

    const stateNames = mobileShelterProfileUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('not_found');
    expect(stateNames).toContain('failed');
  });

  it('mobile foundation content exposes shelterProfile with product-flow-ready status', () => {
    expect(mobileFoundationContent.shelterProfile.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.shelterProfile.title).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.shelterProfile)).not.toContain('service-role');
  });
});
