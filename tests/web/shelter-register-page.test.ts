import { describe, it, expect } from 'vitest';
import { createWebShelterRegistrationUi } from '../../apps/web/src/shelter-register';
import type {
  ShelterRegistrationClient,
  ShelterRegistrationClientInput,
  RegisterShelterClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: RegisterShelterClientResult,
): Pick<ShelterRegistrationClient, 'registerShelter'> => ({
  registerShelter: async () => result,
});

const validInput: ShelterRegistrationClientInput = {
  name: 'Canil de Lisboa',
  kind: 'shelter',
  city: 'Lisboa',
};

describe('shelter register page — boundary contract', () => {
  it('produces failed state when client returns unauthenticated', async () => {
    const client = makeClient({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    const ui = createWebShelterRegistrationUi({ shelterRegistrationClient: client });
    const result = await ui.registerShelter(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces registered state with shelterId on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'registered',
      shelterId: 'shelter-xyz',
    });
    const ui = createWebShelterRegistrationUi({ shelterRegistrationClient: client });
    const result = await ui.registerShelter(validInput);
    expect(result.state).toBe('registered');
    if (result.state === 'registered') {
      expect(result.shelterId).toBe('shelter-xyz');
    }
  });

  it('passes name from input to the client', async () => {
    const seen: string[] = [];
    const trackingClient: Pick<ShelterRegistrationClient, 'registerShelter'> = {
      registerShelter: async (input) => {
        seen.push(input.name);
        return { ok: false, status: 'unauthenticated', reasons: [] };
      },
    };
    const ui = createWebShelterRegistrationUi({ shelterRegistrationClient: trackingClient });
    await ui.registerShelter({ ...validInput, name: 'Canil do Porto' });
    expect(seen).toEqual(['Canil do Porto']);
  });
});
