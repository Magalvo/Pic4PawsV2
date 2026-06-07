import { describe, expect, it } from 'vitest';
import {
  createWebPetFeedUi,
  webPetFeedUiContent,
} from '../../apps/web/src/pet-feed';
import { webFoundationContent } from '../../apps/web/src/foundation';
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

describe('web pet feed UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebPetFeedUi({
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
    expect(webPetFeedUiContent.locale).toBe('pt-PT');
    expect(webPetFeedUiContent.status).toBe('product-flow-ready');
    expect(webPetFeedUiContent.states.map((s) => s.state)).toEqual([
      'idle',
      'loading',
      'loaded',
      'empty',
      'failed',
    ]);
  });

  it('loadFeed with ≥1 pet returns loaded state', async () => {
    const ui = createWebPetFeedUi({
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
      expect(state.title).toBeTruthy();
    }
  });

  it('loadFeed with 0 pets returns empty state with PT-PT copy', async () => {
    const ui = createWebPetFeedUi({
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
    const ui = createWebPetFeedUi({
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
    const ui = createWebPetFeedUi({
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
    const ui = createWebPetFeedUi({
      feedClient: makeFeedClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
      }),
    });

    const state = await ui.loadFeed({ query: {} });
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });

  it('webPetFeedUiContent has pt-PT locale and all required states', () => {
    expect(webPetFeedUiContent.locale).toBe('pt-PT');
    expect(webPetFeedUiContent.status).toBe('product-flow-ready');
    expect(webPetFeedUiContent.states.map((s) => s.state)).toContain('idle');
    expect(webPetFeedUiContent.states.map((s) => s.state)).toContain('loaded');
    expect(webPetFeedUiContent.states.map((s) => s.state)).toContain('empty');
    expect(webPetFeedUiContent.states.map((s) => s.state)).toContain('failed');
  });

  it('web foundation content exposes petFeed with product-flow-ready status', () => {
    expect(webFoundationContent.petFeed.status).toBe('product-flow-ready');
    expect(webFoundationContent.petFeed.title).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.petFeed)).not.toContain('service-role');
  });
});
