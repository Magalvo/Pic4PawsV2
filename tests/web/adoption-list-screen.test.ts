import { describe, it, expect } from 'vitest';
import { createWebAdoptionListUi } from '../../apps/web/src/adoption-list';
import type { AdoptionListClient, AdoptionListClientResult } from '@pic4paws/client';

const makeClient = (
  result: AdoptionListClientResult,
): Pick<AdoptionListClient, 'loadApplications'> => ({
  loadApplications: async () => result,
});

const application = {
  applicationId: 'app-001',
  petId: 'pet-001',
  applicantUserId: 'user-001',
  applicantFullName: 'Ana Costa',
  applicantEmail: 'ana@example.com',
  applicantCity: 'Lisboa',
  status: 'submitted' as const,
  submittedAt: '2026-06-18T00:00:00.000Z',
};

describe('web adoption list screen — boundary contract', () => {
  it('produces loaded state when applications exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [application], total: 1 });
    const ui = createWebAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes applications and total', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [application], total: 1 });
    const ui = createWebAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    if (result.state === 'loaded') {
      expect(result.applications).toHaveLength(1);
      expect(result.total).toBe(1);
    }
  });

  it('produces empty state when no applications', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [], total: 0 });
    const ui = createWebAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('empty');
  });

  it('produces forbidden state on access denial', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createWebAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('failed');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createWebAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
