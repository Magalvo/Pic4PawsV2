import { describe, expect, it } from 'vitest';
import {
  createWebPetStatusHistoryUi,
  webPetStatusHistoryUiContent,
} from '../../apps/web/src/pet-status-history';
import type {
  WebPetStatusHistoryUiContent,
} from '../../apps/web/src/pet-status-history';
import type { PetStatusHistoryClient, PetStatusHistoryEvent } from '@pic4paws/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeEvent = (overrides?: Partial<PetStatusHistoryEvent>): PetStatusHistoryEvent => ({
  id: 'event-001',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  actorUserId: 'actor-001',
  fromStatus: 'published',
  toStatus: 'archived',
  createdAt: '2026-06-10T10:00:00Z',
  ...overrides,
});

const makeClient = (
  result: Awaited<ReturnType<PetStatusHistoryClient['loadStatusHistory']>>,
): Pick<PetStatusHistoryClient, 'loadStatusHistory'> => ({
  loadStatusHistory: async () => result,
});

// ─── Content ──────────────────────────────────────────────────────────────────

describe('webPetStatusHistoryUiContent', () => {
  it('has locale pt-PT and product-flow-ready status', () => {
    const content: WebPetStatusHistoryUiContent = webPetStatusHistoryUiContent;
    expect(content.locale).toBe('pt-PT');
    expect(content.status).toBe('product-flow-ready');
  });

  it('has title, description, and loadingMessage', () => {
    expect(typeof webPetStatusHistoryUiContent.title).toBe('string');
    expect(typeof webPetStatusHistoryUiContent.description).toBe('string');
    expect(typeof webPetStatusHistoryUiContent.loadingMessage).toBe('string');
  });
});

// ─── Initial state ────────────────────────────────────────────────────────────

describe('createWebPetStatusHistoryUi — initial state', () => {
  it('returns idle state', () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({ ok: true, status: 'ok', petId: 'x', events: [] }),
    });
    expect(ui.getInitialState().state).toBe('idle');
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe('createWebPetStatusHistoryUi — loading state', () => {
  it('getLoadingState returns loading', () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({ ok: true, status: 'ok', petId: 'x', events: [] }),
    });
    expect(ui.getLoadingState().state).toBe('loading');
  });
});

// ─── Success ──────────────────────────────────────────────────────────────────

describe('createWebPetStatusHistoryUi — success', () => {
  it('returns loaded state with events', async () => {
    const events = [makeEvent()];
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({ ok: true, status: 'ok', petId: 'pet-001', events }),
    });
    const state = await ui.loadHistory('pet-001');
    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.petId).toBe('pet-001');
      expect(state.events).toHaveLength(1);
    }
  });

  it('returns loaded state with empty events', async () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({ ok: true, status: 'ok', petId: 'pet-001', events: [] }),
    });
    const state = await ui.loadHistory('pet-001');
    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.events).toHaveLength(0);
    }
  });

  it('exposes correct event shape', async () => {
    const event = makeEvent();
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({ ok: true, status: 'ok', petId: 'pet-001', events: [event] }),
    });
    const state = await ui.loadHistory('pet-001');
    if (state.state === 'loaded') {
      const e = state.events[0];
      expect(e.fromStatus).toBe('published');
      expect(e.toStatus).toBe('archived');
      expect(e.actorUserId).toBe('actor-001');
      expect(e.createdAt).toBe('2026-06-10T10:00:00Z');
    }
  });
});

// ─── Forbidden ────────────────────────────────────────────────────────────────

describe('createWebPetStatusHistoryUi — forbidden', () => {
  it('returns forbidden state on 403', async () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({
        ok: false,
        status: 'forbidden',
        reasons: ['not_a_member'],
      }),
    });
    const state = await ui.loadHistory('pet-001');
    expect(state.state).toBe('forbidden');
  });
});

// ─── Failed ───────────────────────────────────────────────────────────────────

describe('createWebPetStatusHistoryUi — failed', () => {
  it('returns failed state on unauthenticated', async () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });
    const state = await ui.loadHistory('pet-001');
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('returns failed state on pet_not_found', async () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({
        ok: false,
        status: 'pet_not_found',
        reasons: ['pet_not_found'],
      }),
    });
    const state = await ui.loadHistory('pet-001');
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('pet_not_found');
    }
  });

  it('returns failed state on worker_request_failed', async () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });
    const state = await ui.loadHistory('pet-001');
    expect(state.state).toBe('failed');
  });

  it('sanitizes reasons — does not leak service-role or bearer in failed state', async () => {
    const ui = createWebPetStatusHistoryUi({
      petStatusHistoryClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });
    const state = await ui.loadHistory('pet-001');
    const serialized = JSON.stringify(state);
    expect(state.state).toBe('failed');
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer abc123');
  });
});
