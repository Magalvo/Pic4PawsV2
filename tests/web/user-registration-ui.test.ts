import { describe, expect, it, vi } from 'vitest';
import {
  createWebUserRegistrationUi,
  webUserRegistrationUiContent,
} from '../../apps/web/src/user-register';
import { webFoundationContent } from '../../apps/web/src/foundation';
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
  email: 'maria@exemplo.pt',
  password: 'senha-de-teste-valida',
  displayName: 'Maria Silva',
  gdprConsentVersion: 'v1',
};

describe('webUserRegistrationUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(webUserRegistrationUiContent.locale).toBe('pt-PT');
    expect(webUserRegistrationUiContent.status).toBe('product-flow-ready');
  });

  it('has idle, submitting, registered, and failed states defined', () => {
    const stateNames = webUserRegistrationUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('registered');
    expect(stateNames).toContain('failed');
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(webUserRegistrationUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

describe('webFoundationContent — userRegistration entry', () => {
  it('includes userRegistration with product-flow-ready status', () => {
    expect(webFoundationContent.userRegistration.status).toBe('product-flow-ready');
    expect(webFoundationContent.userRegistration.title).toBeTruthy();
  });
});

describe('createWebUserRegistrationUi — getInitialState', () => {
  it('returns idle state with title', () => {
    const ui = createWebUserRegistrationUi({
      userRegistrationClient: makeClient({ ok: true, status: 'registered' }),
    });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });
});

describe('createWebUserRegistrationUi — registerUser', () => {
  it('returns registered state on success', async () => {
    const ui = createWebUserRegistrationUi({
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
    const ui = createWebUserRegistrationUi({
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
    const ui = createWebUserRegistrationUi({
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
    const ui = createWebUserRegistrationUi({
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
    const ui = createWebUserRegistrationUi({
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
    const ui = createWebUserRegistrationUi({
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
