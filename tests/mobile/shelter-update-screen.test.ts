import { describe, it, expect } from 'vitest';
import { createMobileShelterUpdateUi } from '../../apps/mobile/src/shelter-update';
import type {
  ShelterUpdateClient,
  UpdateShelterClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: UpdateShelterClientResult,
): Pick<ShelterUpdateClient, 'updateShelter'> => ({
  updateShelter: async () => result,
});

const validInput = {
  name: 'Abrigo dos Patinhas Actualizado',
  kind: 'association',
  city: 'Porto',
};

describe('shelter update screen — boundary contract', () => {
  it('produces updated state on success', async () => {
    const client = makeClient({ ok: true, status: 'updated', shelterId: 'shelter-001' });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-001', validInput);
    expect(result.state).toBe('updated');
  });

  it('updated state includes shelterId', async () => {
    const client = makeClient({ ok: true, status: 'updated', shelterId: 'shelter-001' });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-001', validInput);
    if (result.state === 'updated') {
      expect(result.shelterId).toBe('shelter-001');
    }
  });

  it('produces failed state with unauthenticated status', async () => {
    const client = makeClient({ ok: false, status: 'unauthenticated', reasons: [] });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-001', validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('produces failed state with forbidden status', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-001', validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('forbidden');
    }
  });

  it('produces failed state with shelter_not_found status', async () => {
    const client = makeClient({ ok: false, status: 'shelter_not_found', reasons: [] });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-999', validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('shelter_not_found');
    }
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-001', validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'updated', shelterId: 'shelter-001' });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });

  it('passes shelterId and input fields to the client', async () => {
    const calls: { id: string; input: typeof validInput }[] = [];
    const trackingClient: Pick<ShelterUpdateClient, 'updateShelter'> = {
      updateShelter: async (id, input) => {
        calls.push({ id, input: input as typeof validInput });
        return { ok: true, status: 'updated', shelterId: id };
      },
    };
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient: trackingClient });
    await ui.updateShelter('shelter-001', validInput);
    expect(calls[0]?.id).toBe('shelter-001');
    expect(calls[0]?.input.name).toBe('Abrigo dos Patinhas Actualizado');
  });
});
