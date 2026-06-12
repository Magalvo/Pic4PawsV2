import { describe, expect, it, vi } from 'vitest';
import {
  createWebShelterRegistrationUi,
  webShelterRegistrationUiContent,
} from '../../apps/web/src/shelter-register';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  ShelterRegistrationClient,
  RegisterShelterClientResult,
  ShelterRegistrationClientInput,
} from '../../packages/client/src/index';

const makeClient = (
  result: RegisterShelterClientResult,
): Pick<ShelterRegistrationClient, 'registerShelter'> => ({
  registerShelter: vi.fn().mockResolvedValue(result),
});

const validInput: ShelterRegistrationClientInput = {
  name: 'Canil de Lisboa',
  kind: 'shelter',
  city: 'Lisboa',
};

describe('webShelterRegistrationUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(webShelterRegistrationUiContent.locale).toBe('pt-PT');
    expect(webShelterRegistrationUiContent.status).toBe('product-flow-ready');
  });

  it('has idle, submitting, registered, and failed states defined', () => {
    const stateNames = webShelterRegistrationUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('registered');
    expect(stateNames).toContain('failed');
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(webShelterRegistrationUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

describe('webFoundationContent — shelterRegistration entry', () => {
  it('includes shelterRegistration with product-flow-ready status', () => {
    expect(webFoundationContent.shelterRegistration.status).toBe('product-flow-ready');
    expect(webFoundationContent.shelterRegistration.title).toBeTruthy();
  });
});

describe('createWebShelterRegistrationUi — getInitialState', () => {
  it('returns idle state with title', () => {
    const ui = createWebShelterRegistrationUi({
      shelterRegistrationClient: makeClient({ ok: true, status: 'registered', shelterId: 'x' }),
    });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });
});

describe('createWebShelterRegistrationUi — registerShelter', () => {
  it('returns registered state with shelterId on success', async () => {
    const ui = createWebShelterRegistrationUi({
      shelterRegistrationClient: makeClient({ ok: true, status: 'registered', shelterId: 'shelter-abc' }),
    });
    const state = await ui.registerShelter(validInput);

    expect(state.state).toBe('registered');
    if (state.state === 'registered') {
      expect(state.shelterId).toBe('shelter-abc');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state with unauthenticated-specific copy when status is unauthenticated', async () => {
    const ui = createWebShelterRegistrationUi({
      shelterRegistrationClient: makeClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });
    const state = await ui.registerShelter(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed state with invalid_payload-specific copy when status is invalid_payload', async () => {
    const ui = createWebShelterRegistrationUi({
      shelterRegistrationClient: makeClient({
        ok: false,
        status: 'invalid_payload',
        reasons: ['name_required'],
      }),
    });
    const state = await ui.registerShelter(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('invalid_payload');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed state with canRetry for generic failures', async () => {
    const ui = createWebShelterRegistrationUi({
      shelterRegistrationClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });
    const state = await ui.registerShelter(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });

  it('sanitizes service-role and bearer patterns from failed state reasons', async () => {
    const ui = createWebShelterRegistrationUi({
      shelterRegistrationClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['error', 'service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.registerShelter(validInput);

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
