import { describe, it, expect } from 'vitest';
import { createMobileShelterDeletionUi } from '../../apps/mobile/src/shelter-delete';
import type { ShelterDeletionClient, DeleteShelterClientResult } from '@pic4paws/client';

const makeClient = (
  result: DeleteShelterClientResult,
): Pick<ShelterDeletionClient, 'deleteShelter'> => ({
  deleteShelter: async () => result,
});

describe('mobile shelter delete screen — boundary contract', () => {
  it('produces deleted state on success', async () => {
    const client = makeClient({ ok: true, status: 'ok', shelterId: 'shelter-001' });
    const ui = createMobileShelterDeletionUi({ shelterDeletionClient: client });
    const result = await ui.deleteShelter('shelter-001');
    expect(result.state).toBe('deleted');
    if (result.state === 'deleted') expect(result.shelterId).toBe('shelter-001');
  });

  it('produces failed state with forbidden status', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileShelterDeletionUi({ shelterDeletionClient: client });
    const result = await ui.deleteShelter('shelter-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.status).toBe('forbidden');
  });

  it('produces failed state with canRetry on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileShelterDeletionUi({ shelterDeletionClient: client });
    const result = await ui.deleteShelter('shelter-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'ok', shelterId: 'shelter-001' });
    const ui = createMobileShelterDeletionUi({ shelterDeletionClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });
});
