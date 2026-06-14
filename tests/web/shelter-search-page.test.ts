import { describe, it, expect } from 'vitest';
import { createWebShelterSearchUi } from '../../apps/web/src/shelter-search';
import type { ShelterSearchClientResult } from '@pic4paws/client';

const shelterStub = {
  id: 'shelter-abc',
  name: 'Abrigo do Porto',
  slug: 'abrigo-do-porto',
  kind: 'association',
  verificationStatus: 'verified',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  logoMediaId: null,
};

describe('shelter search page — boundary contract', () => {
  it('produces empty state when searchShelters returns no shelters', async () => {
    const client = {
      searchShelters: async (): Promise<ShelterSearchClientResult> => ({
        ok: true,
        status: 'ok',
        shelters: [],
        total: 0,
      }),
    };
    const ui = createWebShelterSearchUi({ shelterSearchClient: client });
    const result = await ui.searchShelters({});
    expect(result.state).toBe('empty');
  });

  it('produces loaded state with shelters and total', async () => {
    const client = {
      searchShelters: async (): Promise<ShelterSearchClientResult> => ({
        ok: true,
        status: 'ok',
        shelters: [{ ...shelterStub }],
        total: 1,
      }),
    };
    const ui = createWebShelterSearchUi({ shelterSearchClient: client });
    const result = await ui.searchShelters({});
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.total).toBe(1);
      expect(result.shelters[0].id).toBe('shelter-abc');
    }
  });

  it('produces failed state on client error', async () => {
    const client = {
      searchShelters: async (): Promise<ShelterSearchClientResult> => ({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    };
    const ui = createWebShelterSearchUi({ shelterSearchClient: client });
    const result = await ui.searchShelters({});
    expect(result.state).toBe('failed');
  });
});
