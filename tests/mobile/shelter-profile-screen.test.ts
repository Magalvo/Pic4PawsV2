import { describe, it, expect } from 'vitest';
import { createMobileShelterProfileUi } from '../../apps/mobile/src/shelter-profile';
import type { ShelterProfileClient, ShelterProfileClientResult } from '@pic4paws/client';

const makeClient = (
  result: ShelterProfileClientResult,
): Pick<ShelterProfileClient, 'loadProfile'> => ({
  loadProfile: async () => result,
});

const sampleShelter = {
  id: 'shelter-001',
  name: 'Canil de Lisboa',
  slug: 'canil-de-lisboa',
  kind: 'shelter' as const,
  verificationStatus: 'verified' as const,
  city: 'Lisboa',
  district: null,
  countryCode: 'PT',
  publicEmail: null,
  publicPhone: null,
  description: null,
  logoMediaId: null,
  coverMediaId: null,
};

describe('shelter profile screen — boundary contract', () => {
  it('produces not_found state when client returns shelter_not_found', async () => {
    const client = makeClient({
      ok: false,
      status: 'shelter_not_found',
      reasons: [],
    });
    const ui = createMobileShelterProfileUi({ shelterProfileClient: client });
    const result = await ui.loadProfile('shelter-missing');
    expect(result.state).toBe('not_found');
  });

  it('produces loaded state with shelter on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      shelter: { ...sampleShelter },
    });
    const ui = createMobileShelterProfileUi({ shelterProfileClient: client });
    const result = await ui.loadProfile('shelter-001');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.shelter.id).toBe('shelter-001');
      expect(result.shelter.name).toBe('Canil de Lisboa');
    }
  });

  it('passes shelterId to the client', async () => {
    const seen: string[] = [];
    const trackingClient: Pick<ShelterProfileClient, 'loadProfile'> = {
      loadProfile: async (shelterId) => {
        seen.push(shelterId);
        return { ok: false, status: 'shelter_not_found', reasons: [] };
      },
    };
    const ui = createMobileShelterProfileUi({ shelterProfileClient: trackingClient });
    await ui.loadProfile('shelter-target-xyz');
    expect(seen).toEqual(['shelter-target-xyz']);
  });
});
