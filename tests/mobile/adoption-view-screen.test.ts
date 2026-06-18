import { describe, it, expect } from 'vitest';
import { createMobileAdoptionViewUi } from '../../apps/mobile/src/adoption-view';
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

describe('adoption view screen — boundary contract', () => {
  it('produces loaded state on success', async () => {
    const client = makeClient({ ok: true, status: 'ok', application });
    const ui = createMobileAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-001');
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes application details', async () => {
    const client = makeClient({ ok: true, status: 'ok', application });
    const ui = createMobileAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-001');
    if (result.state === 'loaded') {
      expect(result.application.applicationId).toBe('app-001');
      expect(result.application.applicationStatus).toBe('submitted');
    }
  });

  it('produces not_found state when application is missing', async () => {
    const client = makeClient({ ok: false, status: 'adoption_not_found', reasons: [] });
    const ui = createMobileAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-999');
    expect(result.state).toBe('not_found');
  });

  it('produces forbidden state on access denial', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileAdoptionViewUi({ adoptionViewClient: client });
    const result = await ui.loadAdoptionView('app-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle with PT-PT copy', () => {
    const client = makeClient({ ok: true, status: 'ok', application });
    const ui = createMobileAdoptionViewUi({ adoptionViewClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });
});
