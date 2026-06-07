import { describe, expect, it } from 'vitest';
import {
  createMobilePetProfileUi,
  mobilePetProfileUiContent,
} from '../../apps/mobile/src/pet-profile';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type { PetProfileClient, PetProfileClientResult } from '../../packages/client/src/index';

const makeProfileClient = (result: PetProfileClientResult): Pick<PetProfileClient, 'loadProfile'> => ({
  loadProfile: async () => result,
});

const samplePet = {
  id: 'pet-pub-1',
  shelterId: 'shelter-a',
  name: 'Bobi',
  species: 'dog' as const,
  locationLabel: 'Porto',
  shortDescription: 'Amigável e brincalhão.',
  heroMediaId: 'media-1',
  mediaIds: ['media-1'],
  publishedAt: '2026-06-01T10:00:00.000Z',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
    publicNotes: null,
  },
};

describe('mobile pet profile UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobilePetProfileUi({
      profileClient: {
        loadProfile: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobilePetProfileUiContent.locale).toBe('pt-PT');
    expect(mobilePetProfileUiContent.status).toBe('product-flow-ready');
    expect(mobilePetProfileUiContent.states.map((s) => s.state)).toEqual([
      'idle',
      'loading',
      'loaded',
      'not_found',
      'failed',
    ]);
  });

  it('loadProfile with a valid pet returns loaded state with pet data', async () => {
    const ui = createMobilePetProfileUi({
      profileClient: makeProfileClient({ ok: true, status: 'ok', pet: samplePet }),
    });

    const state = await ui.loadProfile('pet-pub-1');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.pet).toEqual(samplePet);
      expect(state.title).toBeTruthy();
    }
  });

  it('loadProfile returns not_found state when client returns pet_not_found', async () => {
    const ui = createMobilePetProfileUi({
      profileClient: makeProfileClient({
        ok: false,
        status: 'pet_not_found',
        reasons: ['pet_not_found'],
      }),
    });

    const state = await ui.loadProfile('unknown-pet');

    expect(state.state).toBe('not_found');
    if (state.state === 'not_found') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadProfile worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobilePetProfileUi({
      profileClient: makeProfileClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadProfile('pet-pub-1');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('loadProfile worker_response_invalid returns failed state', async () => {
    const ui = createMobilePetProfileUi({
      profileClient: makeProfileClient({
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      }),
    });

    const state = await ui.loadProfile('pet-pub-1');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_response_invalid');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobilePetProfileUi({
      profileClient: makeProfileClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
      }),
    });

    const state = await ui.loadProfile('pet-pub-1');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });

  it('mobilePetProfileUiContent has pt-PT locale and all required states', () => {
    expect(mobilePetProfileUiContent.locale).toBe('pt-PT');
    expect(mobilePetProfileUiContent.status).toBe('product-flow-ready');

    const stateNames = mobilePetProfileUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('not_found');
    expect(stateNames).toContain('failed');
  });

  it('mobile foundation content exposes petProfile with product-flow-ready status', () => {
    expect(mobileFoundationContent.petProfile.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.petProfile.title).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.petProfile)).not.toContain('service-role');
  });
});
