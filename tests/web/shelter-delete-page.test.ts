import { describe, it, expect } from 'vitest';
import { createWebShelterDeletionUi } from '../../apps/web/src/shelter-delete';
import type { ShelterDeletionClient, DeleteShelterClientResult } from '@pic4paws/client';

const makeClient = (
  result: DeleteShelterClientResult,
): Pick<ShelterDeletionClient, 'deleteShelter'> => ({
  deleteShelter: async () => result,
});

describe('web shelter delete page — boundary contract', () => {
  it('produces deleted state on success', async () => {
    const client = makeClient({ ok: true, status: 'deleted', shelterId: 'shelter-001' });
    const ui = createWebShelterDeletionUi({ shelterDeletionClient: client });
    const result = await ui.deleteShelter('shelter-001');
    expect(result.state).toBe('deleted');
    if (result.state === 'deleted') expect(result.shelterId).toBe('shelter-001');
  });

  it('produces failed state with forbidden status', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createWebShelterDeletionUi({ shelterDeletionClient: client });
    const result = await ui.deleteShelter('shelter-001');
    expect(result.state).toBe('failed');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebShelterDeletionUi({ shelterDeletionClient: client });
    const result = await ui.deleteShelter('shelter-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createWebShelterDeletionUi({ shelterDeletionClient: client });
    const result = await ui.deleteShelter('shelter-001');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
