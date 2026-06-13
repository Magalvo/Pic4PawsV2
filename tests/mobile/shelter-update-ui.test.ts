import { describe, expect, it, vi } from 'vitest';
import {
  createMobileShelterUpdateUi,
  mobileShelterUpdateUiContent,
} from '../../apps/mobile/src/shelter-update';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  ShelterUpdateClient,
  UpdateShelterClientResult,
  ShelterUpdateClientInput,
} from '../../packages/client/src/index';

const makeClient = (
  result: UpdateShelterClientResult,
): Pick<ShelterUpdateClient, 'updateShelter'> => ({
  updateShelter: vi.fn().mockResolvedValue(result),
});

const validInput: ShelterUpdateClientInput = { name: 'Canil Atualizado' };

describe('mobileShelterUpdateUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(mobileShelterUpdateUiContent.locale).toBe('pt-PT');
    expect(mobileShelterUpdateUiContent.status).toBe('product-flow-ready');
  });

  it('has idle, submitting, updated, and failed states defined', () => {
    const stateNames = mobileShelterUpdateUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('updated');
    expect(stateNames).toContain('failed');
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(mobileShelterUpdateUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

describe('mobileFoundationContent — shelterUpdate entry', () => {
  it('includes shelterUpdate with product-flow-ready status', () => {
    expect(mobileFoundationContent.shelterUpdate.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.shelterUpdate.title).toBeTruthy();
  });
});

describe('createMobileShelterUpdateUi — getInitialState', () => {
  it('returns idle state with title', () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({ ok: true, status: 'updated', shelterId: 'x' }),
    });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });
});

describe('createMobileShelterUpdateUi — updateShelter', () => {
  it('returns updated state with shelterId on success', async () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({ ok: true, status: 'updated', shelterId: 'shelter-abc' }),
    });
    const state = await ui.updateShelter('shelter-abc', validInput);

    expect(state.state).toBe('updated');
    if (state.state === 'updated') {
      expect(state.shelterId).toBe('shelter-abc');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed with forbidden-specific copy for forbidden status', async () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({ ok: false, status: 'forbidden', reasons: ['forbidden'] }),
    });
    const state = await ui.updateShelter('shelter-abc', validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('forbidden');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed with shelter_not_found-specific copy', async () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({ ok: false, status: 'shelter_not_found', reasons: ['shelter_not_found'] }),
    });
    const state = await ui.updateShelter('missing', validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('shelter_not_found');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed with invalid_payload-specific copy', async () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({ ok: false, status: 'invalid_payload', reasons: ['no_fields_provided'] }),
    });
    const state = await ui.updateShelter('shelter-abc', validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.status).toBe('invalid_payload');
  });

  it('returns failed with unauthenticated-specific copy', async () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({ ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] }),
    });
    const state = await ui.updateShelter('shelter-abc', validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.status).toBe('unauthenticated');
  });

  it('returns failed with canRetry for generic failures', async () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }),
    });
    const state = await ui.updateShelter('shelter-abc', validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.canRetry).toBe(true);
  });

  it('sanitizes service-role and bearer patterns from failed state reasons', async () => {
    const ui = createMobileShelterUpdateUi({
      shelterUpdateClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['error', 'service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.updateShelter('shelter-abc', validInput);

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
