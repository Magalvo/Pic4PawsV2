import { describe, it, expect } from 'vitest';
import { createWebAdoptionStatusUi } from '../../apps/web/src/adoption-status';
import type { AdoptionStatusClient, AdoptionStatusClientResult } from '@pic4paws/client';

const makeClient = (
  result: AdoptionStatusClientResult,
): Pick<AdoptionStatusClient, 'manageAdoptionStatus'> => ({
  manageAdoptionStatus: async () => result,
});

describe('web adoption status page — boundary contract', () => {
  it('produces succeeded state on success', async () => {
    const client = makeClient({ ok: true, status: 'ok', applicationId: 'app-001', newStatus: 'approved' });
    const ui = createWebAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'approved');
    expect(result.state).toBe('succeeded');
    if (result.state === 'succeeded') {
      expect(result.applicationId).toBe('app-001');
      expect(result.newStatus).toBe('approved');
    }
  });

  it('produces failed state with forbidden status', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createWebAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'approved');
    expect(result.state).toBe('failed');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebAdoptionStatusUi({ adoptionStatusClient: client });
    const result = await ui.manageAdoptionStatus('app-001', 'under_review');
    expect(result.state).toBe('failed');
  });
});
