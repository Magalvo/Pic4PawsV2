import { describe, expect, it, vi } from 'vitest';
import {
  createMobileUserRegistrationUi,
  mobileUserRegistrationUiContent,
} from '../../apps/mobile/src/user-register';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  UserRegistrationClient,
  RegisterUserClientResult,
  UserRegistrationClientInput,
} from '../../packages/client/src/index';

const makeClient = (
  result: RegisterUserClientResult,
): Pick<UserRegistrationClient, 'registerUser'> => ({
  registerUser: vi.fn().mockResolvedValue(result),
});

const validInput: UserRegistrationClientInput = {
  email: 'joao@exemplo.pt',
  password: 'senha-de-teste-valida',
  displayName: 'João Costa',
  gdprConsentVersion: 'v1',
};

describe('mobileUserRegistrationUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(mobileUserRegistrationUiContent.locale).toBe('pt-PT');
    expect(mobileUserRegistrationUiContent.status).toBe('product-flow-ready');
  });

  it('has idle, submitting, registered, and failed states defined', () => {
    const stateNames = mobileUserRegistrationUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('registered');
    expect(stateNames).toContain('failed');
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(mobileUserRegistrationUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

describe('mobileFoundationContent — userRegistration entry', () => {
  it('includes userRegistration with product-flow-ready status', () => {
    expect(mobileFoundationContent.userRegistration.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.userRegistration.title).toBeTruthy();
  });
});

describe('createMobileUserRegistrationUi — getInitialState', () => {
  it('returns idle state with title', () => {
    const ui = createMobileUserRegistrationUi({
      userRegistrationClient: makeClient({ ok: true, status: 'registered' }),
    });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });
});

describe('createMobileUserRegistrationUi — registerUser', () => {
  it('returns registered state on success', async () => {
    const ui = createMobileUserRegistrationUi({
      userRegistrationClient: makeClient({ ok: true, status: 'registered' }),
    });
    const state = await ui.registerUser(validInput);

    expect(state.state).toBe('registered');
    if (state.state === 'registered') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state with email_already_registered-specific copy', async () => {
    const ui = createMobileUserRegistrationUi({
      userRegistrationClient: makeClient({
        ok: false,
        status: 'email_already_registered',
        reasons: ['email_already_registered'],
      }),
    });
    const state = await ui.registerUser(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('email_already_registered');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state with invalid_payload-specific copy', async () => {
    const ui = createMobileUserRegistrationUi({
      userRegistrationClient: makeClient({
        ok: false,
        status: 'invalid_payload',
        reasons: ['email_invalid', 'password_too_short'],
      }),
    });
    const state = await ui.registerUser(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('invalid_payload');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed state with canRetry for worker_request_failed', async () => {
    const ui = createMobileUserRegistrationUi({
      userRegistrationClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });
    const state = await ui.registerUser(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed state for user_registration_repository_not_configured', async () => {
    const ui = createMobileUserRegistrationUi({
      userRegistrationClient: makeClient({
        ok: false,
        status: 'user_registration_repository_not_configured',
        reasons: ['user_registration_repository_not_configured'],
      }),
    });
    const state = await ui.registerUser(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('user_registration_repository_not_configured');
      expect(state.canRetry).toBe(true);
    }
  });

  it('sanitizes service-role and bearer patterns from failed state reasons', async () => {
    const ui = createMobileUserRegistrationUi({
      userRegistrationClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['error', 'service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.registerUser(validInput);

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
