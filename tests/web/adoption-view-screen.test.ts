import { describe, it, expect } from 'vitest';
import { createWebAdoptionViewUi } from '../../apps/web/src/adoption-view';
import type { AdoptionViewClient, AdoptionViewClientResult } from '@pic4paws/client';

const makeClient = (
  result: AdoptionViewClientResult,
): Pick<AdoptionViewClient, 'loadAdoptionView'> => ({
  loadAdoptionView: async () => result,
});

const application = {
  applicationId: 'app-001',
  applicationStatus: 'submitted' as const,
  shelterId: 'shelter-001',
  petId: 'pet-001',
};

describe('web adoption view screen — boundary contract', () => {
  it('produces loaded state on success', async () => {
    const client = makeClient({ ok: true, status: 'ok', application });
    const ui = createWebAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-001');
    expect(result.state).toBe('loaded');
  });

  it('produces not_found state when application is missing', async () => {
    const client = makeClient({ ok: false, status: 'adoption_not_found', reasons: [] });
    const ui = createWebAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-999');
    expect(result.state).toBe('not_found');
  });

  it('produces forbidden state on access denial', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createWebAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-001');
    expect(result.state).toBe('failed');
  });
});
