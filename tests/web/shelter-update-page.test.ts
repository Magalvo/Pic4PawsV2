import { describe, it, expect } from 'vitest';
import { createWebShelterUpdateUi } from '../../apps/web/src/shelter-update';
import type {
  ShelterUpdateClient,
  ShelterUpdateClientInput,
  UpdateShelterClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: UpdateShelterClientResult,
): Pick<ShelterUpdateClient, 'updateShelter'> => ({
  updateShelter: async () => result,
});

const validInput: ShelterUpdateClientInput = {
  name: 'Canil de Lisboa',
  kind: 'shelter',
  city: 'Lisboa',
};

describe('shelter update page — boundary contract', () => {
  it('produces failed state when client returns unauthenticated', async () => {
    const client = makeClient({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    const ui = createWebShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-abc', validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces updated state with shelterId on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'updated',
      shelterId: 'shelter-abc',
    });
    const ui = createWebShelterUpdateUi({ shelterUpdateClient: client });
    const result = await ui.updateShelter('shelter-abc', validInput);
    expect(result.state).toBe('updated');
    if (result.state === 'updated') {
      expect(result.shelterId).toBe('shelter-abc');
    }
  });

  it('passes shelterId to the client', async () => {
    const seen: string[] = [];
    const trackingClient: Pick<ShelterUpdateClient, 'updateShelter'> = {
      updateShelter: async (shelterId) => {
        seen.push(shelterId);
        return { ok: false, status: 'unauthenticated', reasons: [] };
      },
    };
    const ui = createWebShelterUpdateUi({ shelterUpdateClient: trackingClient });
    await ui.updateShelter('shelter-target-999', validInput);
    expect(seen).toEqual(['shelter-target-999']);
  });
});
