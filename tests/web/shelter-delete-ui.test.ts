import { describe, expect, it, vi } from 'vitest';
import {
  createWebShelterDeletionUi,
  webShelterDeletionUiContent,
} from '../../apps/web/src/shelter-delete';
import type { ShelterDeletionClient } from '@pic4paws/client';

const makeClient = (result: Awaited<ReturnType<ShelterDeletionClient['deleteShelter']>>) =>
  ({
    deleteShelter: vi.fn().mockResolvedValue(result),
  }) as Pick<ShelterDeletionClient, 'deleteShelter'>;

describe('webShelterDeletionUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(webShelterDeletionUiContent.locale).toBe('pt-PT');
    expect(webShelterDeletionUiContent.status).toBe('product-flow-ready');
  });

  it('covers idle, submitting, deleted, and failed states', () => {
    const stateNames = webShelterDeletionUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('deleted');
    expect(stateNames).toContain('failed');
  });
});

describe('createWebShelterDeletionUi', () => {
  it('getInitialState returns idle state', () => {
    const ui = createWebShelterDeletionUi({ shelterDeletionClient: makeClient({ ok: true, status: 'deleted', shelterId: 'shelter-a' }) });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(typeof state.title).toBe('string');
  });

  it('returns deleted state with shelterId on success', async () => {
    const ui = createWebShelterDeletionUi({
      shelterDeletionClient: makeClient({ ok: true, status: 'deleted', shelterId: 'shelter-a' }),
    });

    const state = await ui.deleteShelter('shelter-a');

    expect(state.state).toBe('deleted');
    if (state.state === 'deleted') {
      expect(state.shelterId).toBe('shelter-a');
    }
  });

  it('returns failed state with forbidden copy for forbidden status', async () => {
    const ui = createWebShelterDeletionUi({
      shelterDeletionClient: makeClient({ ok: false, status: 'forbidden', reasons: ['forbidden'] }),
    });

    const state = await ui.deleteShelter('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('forbidden');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state with shelter_not_found copy for shelter_not_found status', async () => {
    const ui = createWebShelterDeletionUi({
      shelterDeletionClient: makeClient({ ok: false, status: 'shelter_not_found', reasons: ['shelter_not_found'] }),
    });

    const state = await ui.deleteShelter('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('shelter_not_found');
    }
  });

  it('returns failed state with unauthenticated copy for unauthenticated status', async () => {
    const ui = createWebShelterDeletionUi({
      shelterDeletionClient: makeClient({ ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] }),
    });

    const state = await ui.deleteShelter('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('sanitizes service-role and bearer markers from generic failed reasons', async () => {
    const ui = createWebShelterDeletionUi({
      shelterDeletionClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['service-role-key-leaked', 'bearer token123'],
      }),
    });

    const state = await ui.deleteShelter('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      const serialized = JSON.stringify(state.reasons);
      expect(serialized).not.toContain('service-role');
      expect(serialized).not.toContain('bearer ');
    }
  });
});
