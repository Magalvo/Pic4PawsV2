import { describe, it, expect } from 'vitest';
import { createMobileAdoptionStatusUi } from '../../apps/mobile/src/adoption-status';
import type { AdoptionStatusClient, AdoptionStatusClientResult } from '@pic4paws/client';

const makeClient = (
  result: AdoptionStatusClientResult,
): Pick<AdoptionStatusClient, 'manageAdoptionStatus'> => ({
  manageAdoptionStatus: async () => result,
});

describe('mobile adoption status screen — boundary contract', () => {
  it('produces succeeded state on success', async () => {
    const client = makeClient({ ok: true, status: 'ok', applicationId: 'app-001', newStatus: 'approved' });
    const ui = createMobileAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'approved');
    expect(result.state).toBe('succeeded');
  });

  it('succeeded state includes applicationId and newStatus', async () => {
    const client = makeClient({ ok: true, status: 'ok', applicationId: 'app-001', newStatus: 'rejected' });
    const ui = createMobileAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'rejected');
    if (result.state === 'succeeded') {
      expect(result.applicationId).toBe('app-001');
      expect(result.newStatus).toBe('rejected');
    }
  });

  it('produces failed state with forbidden status', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'approved');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.status).toBe('forbidden');
  });

  it('produces failed state with canRetry on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'under_review');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileAdoptionStatusUi({ adoptionStatusClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createMobileAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'approved');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
