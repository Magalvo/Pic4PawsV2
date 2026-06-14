import { describe, it, expect } from 'vitest';
import { createWebShelterProfileUi } from '../../apps/web/src/shelter-profile';
import type { ShelterProfileClientResult, ShelterProfileClientShelter } from '@pic4paws/client';

const shelterStub: ShelterProfileClientShelter = {
  id: 'shelter-abc',
  name: 'Abrigo do Porto',
  slug: 'abrigo-do-porto',
  kind: 'association',
  verificationStatus: 'verified',
  publicEmail: 'info@abrigo.pt',
  publicPhone: null,
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  description: 'Um abrigo de animais no Porto.',
  logoMediaId: null,
  coverMediaId: null,
};

describe('shelter profile page — boundary contract', () => {
  it('produces not_found state for shelter_not_found client response', async () => {
    const client = {
      loadProfile: async (): Promise<ShelterProfileClientResult> => ({
        ok: false,
        status: 'shelter_not_found',
        reasons: [],
      }),
    };
    const ui = createWebShelterProfileUi({ shelterProfileClient: client });
    const result = await ui.loadProfile('shelter-missing');
    expect(result.state).toBe('not_found');
  });

  it('produces loaded state with the fetched shelter', async () => {
    const client = {
      loadProfile: async (): Promise<ShelterProfileClientResult> => ({
        ok: true,
        status: 'ok',
        shelter: { ...shelterStub },
      }),
    };
    const ui = createWebShelterProfileUi({ shelterProfileClient: client });
    const result = await ui.loadProfile('shelter-abc');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.shelter.id).toBe('shelter-abc');
      expect(result.shelter.name).toBe('Abrigo do Porto');
    }
  });

  it('passes the exact shelterId to shelterProfileClient.loadProfile', async () => {
    const seen: string[] = [];
    const client = {
      loadProfile: async (shelterId: string): Promise<ShelterProfileClientResult> => {
        seen.push(shelterId);
        return { ok: false, status: 'shelter_not_found', reasons: [] };
      },
    };
    const ui = createWebShelterProfileUi({ shelterProfileClient: client });
    await ui.loadProfile('shelter-xyz-789');
    expect(seen).toEqual(['shelter-xyz-789']);
  });
});
