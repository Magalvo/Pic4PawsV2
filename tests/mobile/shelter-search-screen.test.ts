import { describe, it, expect } from 'vitest';
import { createMobileShelterSearchUi } from '../../apps/mobile/src/shelter-search';
import type { ShelterSearchClient, ShelterSearchClientResult } from '@pic4paws/client';

const makeClient = (
  result: ShelterSearchClientResult,
): Pick<ShelterSearchClient, 'searchShelters'> => ({
  searchShelters: async () => result,
});

const sampleShelter = {
  id: 'shelter-001',
  name: 'Canil de Lisboa',
  slug: 'canil-de-lisboa',
  kind: 'shelter' as const,
  verificationStatus: 'verified' as const,
  city: 'Lisboa',
  district: null as string | null,
  countryCode: 'PT',
  logoMediaId: null as string | null,
};

describe('shelter search screen — boundary contract', () => {
  it('produces failed state when client returns an error', async () => {
    const client = makeClient({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
    const ui = createMobileShelterSearchUi({ shelterSearchClient: client });
    const result = await ui.searchShelters({});
    expect(result.state).toBe('failed');
  });

  it('produces loaded state with shelters on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      shelters: [{ ...sampleShelter }],
      total: 1,
    });
    const ui = createMobileShelterSearchUi({ shelterSearchClient: client });
    const result = await ui.searchShelters({});
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.shelters).toHaveLength(1);
      expect(result.shelters[0].id).toBe('shelter-001');
    }
  });

  it('produces empty state when no shelters returned', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      shelters: [],
      total: 0,
    });
    const ui = createMobileShelterSearchUi({ shelterSearchClient: client });
    const result = await ui.searchShelters({});
    expect(result.state).toBe('empty');
  });
});
