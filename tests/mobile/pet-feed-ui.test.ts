import { describe, expect, it } from 'vitest';
import {
  createMobilePetFeedUi,
  mobilePetFeedUiContent,
} from '../../apps/mobile/src/pet-feed';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type { PetFeedClient, PetFeedClientResult } from '../../packages/client/src/index';

const makeFeedClient = (result: PetFeedClientResult): Pick<PetFeedClient, 'loadFeed'> => ({
  loadFeed: async () => result,
});

const samplePet = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  name: 'Bobi',
  species: 'dog' as const,
  locationLabel: 'Porto',
  shortDescription: 'Amigável.',
  heroMediaId: 'media-1',
  mediaIds: ['media-1'],
  publishedAt: '2026-06-01T10:00:00.000Z',
};

describe('mobile pet feed UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobilePetFeedUi({
      feedClient: {
        loadFeed: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBe('Explorar animais');
    expect(state.primaryAction).toBeTruthy();
    expect(mobilePetFeedUiContent.locale).toBe('pt-PT');
    expect(mobilePetFeedUiContent.status).toBe('product-flow-ready');
    expect(mobilePetFeedUiContent.states.map((s) => s.state)).toEqual([
      'idle',
      'loading',
      'loaded',
      'empty',
      'failed',
    ]);
  });

  it('loadFeed with ≥1 pet returns loaded state', async () => {
    const ui = createMobilePetFeedUi({
      feedClient: makeFeedClient({
        ok: true,
        status: 'ok',
        pets: [samplePet, samplePet],
        total: 2,
      }),
    });

    const state = await ui.loadFeed({ query: {} });

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.pets).toHaveLength(2);
      expect(state.total).toBe(2);
    }
  });

  it('loadFeed with 0 pets returns empty state with PT-PT copy', async () => {
    const ui = createMobilePetFeedUi({
      feedClient: makeFeedClient({ ok: true, status: 'ok', pets: [], total: 0 }),
    });

    const state = await ui.loadFeed({ query: {} });

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadFeed worker_request_failed returns failed state with PT-PT copy and canRetry', async () => {
    const ui = createMobilePetFeedUi({
      feedClient: makeFeedClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadFeed({ query: {} });

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('loadFeed worker_response_invalid returns failed state', async () => {
    const ui = createMobilePetFeedUi({
      feedClient: makeFeedClient({
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      }),
    });

    const state = await ui.loadFeed({ query: {} });

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_response_invalid');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobilePetFeedUi({
      feedClient: makeFeedClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'signedUrl=https://r2.test'],
      }),
    });

    const state = await ui.loadFeed({ query: {} });
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('signedUrl');
  });

  it('mobilePetFeedUiContent has pt-PT locale and all required states', () => {
    expect(mobilePetFeedUiContent.locale).toBe('pt-PT');
    expect(mobilePetFeedUiContent.status).toBe('product-flow-ready');
    expect(mobilePetFeedUiContent.states.map((s) => s.state)).toContain('idle');
    expect(mobilePetFeedUiContent.states.map((s) => s.state)).toContain('loaded');
    expect(mobilePetFeedUiContent.states.map((s) => s.state)).toContain('empty');
    expect(mobilePetFeedUiContent.states.map((s) => s.state)).toContain('failed');
  });

  it('mobile foundation content exposes petFeed with product-flow-ready status', () => {
    expect(mobileFoundationContent.petFeed.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.petFeed.title).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.petFeed)).not.toContain('service-role');
  });
});
