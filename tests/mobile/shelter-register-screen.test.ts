import { describe, it, expect } from 'vitest';
import { createMobileShelterRegistrationUi } from '../../apps/mobile/src/shelter-register';
import type {
  ShelterRegistrationClient,
  RegisterShelterClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: RegisterShelterClientResult,
): Pick<ShelterRegistrationClient, 'registerShelter'> => ({
  registerShelter: async () => result,
});

const validInput = {
  name: 'Abrigo dos Patinhas',
  kind: 'shelter',
  city: 'Lisboa',
  district: 'Lisboa',
  publicEmail: 'abrigo@example.com',
  publicPhone: '210000000',
  description: 'Um abrigo para animais abandonados.',
};

describe('shelter register screen — boundary contract', () => {
  it('produces registered state on success', async () => {
    const client = makeClient({ ok: true, status: 'registered', shelterId: 'shelter-001' });
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient: client });
    const result = await ui.registerShelter(validInput);
    expect(result.state).toBe('registered');
  });

  it('registered state includes shelterId', async () => {
    const client = makeClient({ ok: true, status: 'registered', shelterId: 'shelter-001' });
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient: client });
    const result = await ui.registerShelter(validInput);
    if (result.state === 'registered') {
      expect(result.shelterId).toBe('shelter-001');
    }
  });

  it('produces failed state with unauthenticated status', async () => {
    const client = makeClient({ ok: false, status: 'unauthenticated', reasons: [] });
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient: client });
    const result = await ui.registerShelter(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('produces failed state with invalid_payload status', async () => {
    const client = makeClient({ ok: false, status: 'invalid_payload', reasons: ['name_required'] });
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient: client });
    const result = await ui.registerShelter(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('invalid_payload');
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient: client });
    const result = await ui.registerShelter(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'registered', shelterId: 'shelter-001' });
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });

  it('passes all input fields to the client', async () => {
    const seen: typeof validInput[] = [];
    const trackingClient: Pick<ShelterRegistrationClient, 'registerShelter'> = {
      registerShelter: async (input) => {
        seen.push(input as typeof validInput);
        return { ok: true, status: 'registered', shelterId: 'shelter-001' };
      },
    };
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient: trackingClient });
    await ui.registerShelter(validInput);
    expect(seen[0]?.name).toBe('Abrigo dos Patinhas');
    expect(seen[0]?.city).toBe('Lisboa');
    expect(seen[0]?.kind).toBe('shelter');
  });
});
