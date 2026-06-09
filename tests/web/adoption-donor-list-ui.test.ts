import { describe, expect, it, vi } from 'vitest';
import {
  createWebAdoptionDonorListUi,
  webAdoptionDonorListUiContent,
} from '../../apps/web/src/adoption-donor-list';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  AdoptionDonorListClient,
  AdoptionDonorListItem,
} from '../../packages/client/src/index';

const makeApplication = (overrides: Partial<AdoptionDonorListItem> = {}): AdoptionDonorListItem => ({
  applicationId: 'app-001',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  status: 'submitted',
  submittedAt: '2026-01-01T12:00:00Z',
  ...overrides,
});

const makeClient = (
  success: boolean,
  applications: AdoptionDonorListItem[] = [makeApplication()],
  total = 1,
): Pick<AdoptionDonorListClient, 'loadDonorAdoptions'> => ({
  loadDonorAdoptions: vi.fn().mockResolvedValue(
    success
      ? { ok: true, status: 'ok', applications, total }
      : { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
  ),
});

describe('web adoption donor list UI', () => {
  it('getInitialState returns idle state', () => {
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient: makeClient(true) });
    expect(ui.getInitialState().state).toBe('idle');
  });

  it('loadDonorAdoptions returns loaded state with applications', async () => {
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient: makeClient(true) });
    const state = await ui.loadDonorAdoptions();

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.applications).toHaveLength(1);
      expect(state.total).toBe(1);
    }
  });

  it('loadDonorAdoptions returns empty state for zero applications', async () => {
    const ui = createWebAdoptionDonorListUi({
      adoptionDonorListClient: makeClient(true, [], 0),
    });
    const state = await ui.loadDonorAdoptions();

    expect(state.state).toBe('empty');
  });

  it('loadDonorAdoptions returns failed state on client error', async () => {
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient: makeClient(false) });
    const state = await ui.loadDonorAdoptions();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('webAdoptionDonorListUiContent locale is pt-PT', () => {
    expect(webAdoptionDonorListUiContent.locale).toBe('pt-PT');
  });

  it('webAdoptionDonorListUiContent status is product-flow-ready', () => {
    expect(webAdoptionDonorListUiContent.status).toBe('product-flow-ready');
  });

  it('web foundation content exposes adoptionDonorList with product-flow-ready status', () => {
    expect(webFoundationContent.adoptionDonorList.status).toBe('product-flow-ready');
    expect(webFoundationContent.adoptionDonorList.title).toBeTruthy();
    expect(webFoundationContent.adoptionDonorList.description).toBeTruthy();
  });
});
