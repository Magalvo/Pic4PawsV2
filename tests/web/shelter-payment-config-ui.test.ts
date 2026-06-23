import { describe, expect, it, vi } from 'vitest';
import {
  createWebShelterPaymentConfigUi,
  webShelterPaymentConfigUiContent,
} from '../../apps/web/src/shelter-payment-config';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  SavePaymentConfigClient,
  LoadPaymentConfigClient,
  ShelterPaymentConfigClientResult,
  LoadPaymentConfigClientResult,
} from '../../packages/client/src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SHELTER_ID = 'shelter-001';
const VALID_IBAN = 'PT50000201231234567890154';

const makeSaveClient = (
  result: ShelterPaymentConfigClientResult,
): Pick<SavePaymentConfigClient, 'savePaymentConfig'> => ({
  savePaymentConfig: vi.fn().mockResolvedValue(result),
});

const makeLoadClient = (
  result: LoadPaymentConfigClientResult,
): Pick<LoadPaymentConfigClient, 'loadPaymentConfig'> => ({
  loadPaymentConfig: vi.fn().mockResolvedValue(result),
});

const makeUi = (
  loadResult: LoadPaymentConfigClientResult,
  saveResult: ShelterPaymentConfigClientResult,
) =>
  createWebShelterPaymentConfigUi({
    saveConfigClient: makeSaveClient(saveResult),
    loadConfigClient: makeLoadClient(loadResult),
  });

// ─── webShelterPaymentConfigUiContent ────────────────────────────────────────

describe('webShelterPaymentConfigUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(webShelterPaymentConfigUiContent.locale).toBe('pt-PT');
    expect(webShelterPaymentConfigUiContent.status).toBe('product-flow-ready');
  });

  it('has idle, saving, saved, failed, and forbidden states defined', () => {
    const stateNames = webShelterPaymentConfigUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('saving');
    expect(stateNames).toContain('saved');
    expect(stateNames).toContain('failed');
    expect(stateNames).toContain('forbidden');
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(webShelterPaymentConfigUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

// ─── webFoundationContent ─────────────────────────────────────────────────────

describe('webFoundationContent — shelterPaymentConfig entry', () => {
  it('includes shelterPaymentConfig with product-flow-ready status', () => {
    expect(webFoundationContent.shelterPaymentConfig.status).toBe('product-flow-ready');
    expect(webFoundationContent.shelterPaymentConfig.title).toBeTruthy();
  });
});

// ─── loadConfig ───────────────────────────────────────────────────────────────

describe('createWebShelterPaymentConfigUi — loadConfig', () => {
  it('returns idle with iban and mbWayPhone when config is loaded', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: true, tier: 'manual', iban: VALID_IBAN, mbWayPhone: '+351912345678' },
      { ok: true, status: 'payment_config_saved', tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
    );
    const state = await ui.loadConfig(SHELTER_ID);
    expect(state.state).toBe('idle');
    if (state.state === 'idle') {
      expect(state.iban).toBe(VALID_IBAN);
      expect(state.mbWayPhone).toBe('+351912345678');
      expect(state.title).toBeTruthy();
    }
  });

  it('returns idle with empty strings when not configured', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: false, tier: null, iban: null, mbWayPhone: null },
      { ok: true, status: 'payment_config_saved', tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
    );
    const state = await ui.loadConfig(SHELTER_ID);
    expect(state.state).toBe('idle');
    if (state.state === 'idle') {
      expect(state.iban).toBe('');
      expect(state.mbWayPhone).toBe('');
    }
  });

  it('returns forbidden state when load returns forbidden', async () => {
    const ui = makeUi(
      { ok: false, status: 'forbidden', reasons: ['forbidden'] },
      { ok: true, status: 'payment_config_saved', tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
    );
    const state = await ui.loadConfig(SHELTER_ID);
    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state on load network error', async () => {
    const ui = makeUi(
      { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
      { ok: true, status: 'payment_config_saved', tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
    );
    const state = await ui.loadConfig(SHELTER_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
    }
  });

  it('returns failed state on unauthenticated load', async () => {
    const ui = makeUi(
      { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] },
      { ok: true, status: 'payment_config_saved', tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
    );
    const state = await ui.loadConfig(SHELTER_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });
});

// ─── saveConfig ───────────────────────────────────────────────────────────────

describe('createWebShelterPaymentConfigUi — saveConfig', () => {
  it('returns saved state on success', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: true, tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
      { ok: true, status: 'payment_config_saved', tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
    );
    const state = await ui.saveConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(state.state).toBe('saved');
    if (state.state === 'saved') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns forbidden state when save returns forbidden', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: true, tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
      { ok: false, status: 'forbidden', reasons: ['forbidden'] },
    );
    const state = await ui.saveConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(state.state).toBe('forbidden');
  });

  it('returns failed state on invalid_config', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: true, tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
      { ok: false, status: 'invalid_config', reasons: ['iban_required'] },
    );
    const state = await ui.saveConfig(SHELTER_ID, { iban: '' });
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('invalid_config');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed state on network error', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: true, tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
      { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
    );
    const state = await ui.saveConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });

  it('sanitizes credential patterns from failed state reasons', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: true, tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
      { ok: false, status: 'worker_request_failed', reasons: ['service-role-key', 'bearer token'] },
    );
    const state = await ui.saveConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });

  it('returns failed state on unauthenticated save', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', configured: true, tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
      { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] },
    );
    const state = await ui.saveConfig(SHELTER_ID, { iban: VALID_IBAN });
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });
});
