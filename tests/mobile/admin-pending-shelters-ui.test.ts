import { describe, expect, it, vi } from 'vitest';
import {
  createMobileAdminPendingSheltersUi,
  mobileAdminPendingSheltersUiContent,
} from '../../apps/mobile/src/admin-pending-shelters';
import type {
  AdminPendingShelterClientSummary,
  AdminPendingSheltersClient,
  AdminPendingSheltersClientResult,
} from '../../packages/client/src/index';

const sampleShelter: AdminPendingShelterClientSummary = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter',
  verificationStatus: 'pending_review',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  publicEmail: 'contacto@abrigo.pt',
  publicPhone: '+351912345678',
  logoMediaId: null,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-10T10:00:00.000Z',
};

const makeClient = (
  result: AdminPendingSheltersClientResult,
): Pick<AdminPendingSheltersClient, 'loadPendingShelters'> => ({
  loadPendingShelters: vi.fn().mockResolvedValue(result),
});

describe('mobileAdminPendingSheltersUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(mobileAdminPendingSheltersUiContent.locale).toBe('pt-PT');
    expect(mobileAdminPendingSheltersUiContent.status).toBe('product-flow-ready');
  });

  it('defines idle, loaded, empty, forbidden, and failed states', () => {
    const states = mobileAdminPendingSheltersUiContent.states.map((state) => state.state);
    expect(states).toEqual(expect.arrayContaining(['idle', 'loaded', 'empty', 'forbidden', 'failed']));
  });

  it('does not expose credential markers in static content', () => {
    const serialized = JSON.stringify(mobileAdminPendingSheltersUiContent);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});

describe('createMobileAdminPendingSheltersUi', () => {
  it('returns an idle initial state with PT-PT copy', () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({ ok: true, status: 'ok', shelters: [], total: 0 }),
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
  });

  it('maps a non-empty success result to loaded with review links', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({
        ok: true,
        status: 'ok',
        shelters: [sampleShelter],
        total: 1,
      }),
    });

    const state = await ui.loadPendingShelters({ limit: 10, offset: 0 });

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.title).toBe('Abrigos por rever');
      expect(state.total).toBe(1);
      expect(state.shelters[0]).toMatchObject({
        id: 'shelter-a',
        reviewHref: '/abrigos/shelter-a/verificar',
      });
      expect(state.query).toEqual({ limit: 10, offset: 0 });
    }
  });

  it('passes query through to the client unchanged', async () => {
    const client = makeClient({ ok: true, status: 'ok', shelters: [], total: 0 });
    const ui = createMobileAdminPendingSheltersUi({ adminPendingSheltersClient: client });
    const query = { limit: 5, offset: 15 };

    await ui.loadPendingShelters(query);

    expect(client.loadPendingShelters).toHaveBeenCalledWith(query);
  });

  it('maps a successful empty result to empty state', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({ ok: true, status: 'ok', shelters: [], total: 0 }),
    });

    const state = await ui.loadPendingShelters();

    expect(state.state).toBe('empty');
    if (state.state === 'empty') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('maps forbidden failures to a dedicated forbidden state', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.loadPendingShelters();

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBe('Acesso reservado');
      expect(state.message).toContain('administradores');
    }
  });

  it('maps unauthenticated failures to failed state with retry', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadPendingShelters();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
      expect(state.canRetry).toBe(true);
    }
  });

  it('maps repository failures to failed state', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({
        ok: false,
        status: 'admin_pending_shelters_repository_not_configured',
        reasons: ['admin_pending_shelters_repository_not_configured'],
      }),
    });

    const state = await ui.loadPendingShelters();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('admin_pending_shelters_repository_not_configured');
      expect(state.canRetry).toBe(true);
    }
  });

  it('maps request failures to failed state', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadPendingShelters();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.status).toBe('worker_request_failed');
  });

  it('maps invalid response failures to failed state', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      }),
    });

    const state = await ui.loadPendingShelters();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.status).toBe('worker_response_invalid');
  });

  it('sanitizes service-role and bearer patterns from failed state reasons', async () => {
    const ui = createMobileAdminPendingSheltersUi({
      adminPendingSheltersClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-key', 'bearer token-value'],
      }),
    });

    const state = await ui.loadPendingShelters();
    const serialized = JSON.stringify(state);

    expect(state.state).toBe('failed');
    expect(serialized).toContain('safe_reason');
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
