import { describe, expect, it } from 'vitest';
import {
  createWebShelterSearchUi,
  webShelterSearchUiContent,
} from '../../apps/web/src/shelter-search';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type { ShelterSearchClient, ShelterSearchClientResult } from '../../packages/client/src/index';

const makeClient = (result: ShelterSearchClientResult): Pick<ShelterSearchClient, 'searchShelters'> => ({
  searchShelters: async () => result,
});

const sampleShelter = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter',
  verificationStatus: 'verified',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  logoMediaId: 'logo-1',
};

describe('web shelter search UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: {
        searchShelters: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(webShelterSearchUiContent.locale).toBe('pt-PT');
    expect(webShelterSearchUiContent.status).toBe('product-flow-ready');
    expect(webShelterSearchUiContent.states.map((s) => s.state)).toEqual([
      'idle',
      'loading',
      'loaded',
      'empty',
      'failed',
    ]);
  });

  it('searchShelters with ≥1 shelter returns loaded state', async () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: makeClient({
        ok: true,
        status: 'ok',
        shelters: [sampleShelter, sampleShelter],
        total: 2,
      }),
    });

    const state = await ui.searchShelters({});

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.shelters).toHaveLength(2);
      expect(state.total).toBe(2);
      expect(state.title).toBeTruthy();
    }
  });

  it('searchShelters with 0 shelters returns empty state with PT-PT copy', async () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: makeClient({ ok: true, status: 'ok', shelters: [], total: 0 }),
    });

    const state = await ui.searchShelters({});

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('searchShelters worker_request_failed returns failed state with PT-PT copy and canRetry', async () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.searchShelters({});

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('searchShelters worker_response_invalid returns failed state', async () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: makeClient({
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      }),
    });

    const state = await ui.searchShelters({});

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_response_invalid');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.searchShelters({});
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('loaded state passes query through', async () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: makeClient({
        ok: true,
        status: 'ok',
        shelters: [sampleShelter],
        total: 1,
      }),
    });

    const query = { kind: 'sanctuary', limit: 5, offset: 10 };
    const state = await ui.searchShelters(query);

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.query).toEqual(query);
    }
  });

  it('empty state passes query through', async () => {
    const ui = createWebShelterSearchUi({
      shelterSearchClient: makeClient({ ok: true, status: 'ok', shelters: [], total: 0 }),
    });

    const query = { kind: 'rescue' };
    const state = await ui.searchShelters(query);

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.query).toEqual(query);
    }
  });

  it('webShelterSearchUiContent has pt-PT locale and all required states', () => {
    expect(webShelterSearchUiContent.locale).toBe('pt-PT');
    expect(webShelterSearchUiContent.status).toBe('product-flow-ready');
    expect(webShelterSearchUiContent.states.map((s) => s.state)).toContain('idle');
    expect(webShelterSearchUiContent.states.map((s) => s.state)).toContain('loaded');
    expect(webShelterSearchUiContent.states.map((s) => s.state)).toContain('empty');
    expect(webShelterSearchUiContent.states.map((s) => s.state)).toContain('failed');
  });

  it('web foundation content exposes shelterSearch with product-flow-ready status', () => {
    expect(webFoundationContent.shelterSearch.status).toBe('product-flow-ready');
    expect(webFoundationContent.shelterSearch.title).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.shelterSearch)).not.toContain('service-role');
  });
});
