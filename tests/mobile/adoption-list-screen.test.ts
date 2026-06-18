import { describe, it, expect } from 'vitest';
import { createMobileAdoptionListUi } from '../../apps/mobile/src/adoption-list';
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

describe('adoption list screen — boundary contract', () => {
  it('produces loaded state when applications exist', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [application], total: 1 });
    const ui = createMobileAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('loaded');
  });

  it('loaded state includes applications and total', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [application], total: 1 });
    const ui = createMobileAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    if (result.state === 'loaded') {
      expect(result.applications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.applications[0]?.applicantFullName).toBe('Ana Costa');
    }
  });

  it('produces empty state when no applications', async () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [], total: 0 });
    const ui = createMobileAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('empty');
  });

  it('produces forbidden state on access denial', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileAdoptionListUi({ adoptionListClient: client });
    const result = await ui.loadApplications('shelter-001');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle with PT-PT copy', () => {
    const client = makeClient({ ok: true, status: 'ok', applications: [], total: 0 });
    const ui = createMobileAdoptionListUi({ adoptionListClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });
});
