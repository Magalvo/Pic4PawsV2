import { describe, it, expect } from 'vitest';
import { createWebAdoptionDonorListUi } from '../../apps/web/src/adoption-donor-list';
import type { AdoptionDonorListClient, AdoptionDonorListClientResult } from '@pic4paws/client';

const makeClient = (
  result: AdoptionDonorListClientResult,
): Pick<AdoptionDonorListClient, 'loadDonorAdoptions'> => ({
  loadDonorAdoptions: async () => result,
});

const item = {
  applicationId: 'app-001',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  status: 'submitted' as const,
  submittedAt: '2026-06-18T00:00:00.000Z',
};

describe('web adoption donor list screen — boundary contract', () => {
  it('produces loaded state when applications exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [item], total: 1 });
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient: client });
    const result = await ui.loadDonorAdoptions();
    expect(result.state).toBe('loaded');
  });

  it('produces empty state when no applications', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [], total: 0 });
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient: client });
    const result = await ui.loadDonorAdoptions();
    expect(result.state).toBe('empty');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient: client });
    const result = await ui.loadDonorAdoptions();
    expect(result.state).toBe('failed');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient: client });
    const result = await ui.loadDonorAdoptions();
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
