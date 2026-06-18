import { describe, it, expect } from 'vitest';
import { createMobilePetStatusHistoryUi } from '../../apps/mobile/src/pet-status-history';
import type { PetStatusHistoryClient, LoadPetStatusHistoryClientResult } from '@pic4paws/client';

const makeClient = (
  result: LoadPetStatusHistoryClientResult,
): Pick<PetStatusHistoryClient, 'loadStatusHistory'> => ({
  loadStatusHistory: async () => result,
});

const event = {
  id: 'evt-001',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  actorUserId: 'user-001',
  fromStatus: 'draft' as const,
  toStatus: 'published' as const,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('mobile pet status history screen — boundary contract', () => {
  it('produces loaded state with events', async () => {
    const client = makeClient({ ok: true, status: 'ok', events: [event] });
    const ui = createMobilePetStatusHistoryUi({ petStatusHistoryClient: client });
    const result = await ui.loadHistory('pet-001');
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes events array', async () => {
    const client = makeClient({ ok: true, status: 'ok', events: [event] });
    const ui = createMobilePetStatusHistoryUi({ petStatusHistoryClient: client });
    const result = await ui.loadHistory('pet-001');
    if (result.state === 'loaded') {
      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe('evt-001');
    }
  });

  it('produces forbidden state', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobilePetStatusHistoryUi({ petStatusHistoryClient: client });
    const result = await ui.loadHistory('pet-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobilePetStatusHistoryUi({ petStatusHistoryClient: client });
    const result = await ui.loadHistory('pet-001');
    expect(result.state).toBe('failed');
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'ok', events: [] });
    const ui = createMobilePetStatusHistoryUi({ petStatusHistoryClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });
});
