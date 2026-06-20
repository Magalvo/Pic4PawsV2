import { describe, it, expect } from 'vitest';
import { createWebAuthUi } from '../../apps/web/src/auth';

const makeClient = (overrides: Record<string, unknown> = {}) => ({
  auth: {
    signInWithPassword: async () => ({ data: null, error: { message: 'unused' } }),
    resetPasswordForEmail: async () => ({ error: null }),
    exchangeCodeForSession: async () => ({ data: { session: { access_token: 'tok' } }, error: null }),
    updateUser: async () => ({ error: null }),
    ...overrides,
  },
});

describe('requestPasswordReset', () => {
  it('returns email_sent on success', async () => {
    const ui = createWebAuthUi({ authClient: makeClient() });
    const result = await ui.requestPasswordReset('user@example.com', 'https://app.test/recuperar-palavra-passe/confirmar');
    expect(result.state).toBe('email_sent');
  });

  it('returns failed when Supabase returns an error', async () => {
    const ui = createWebAuthUi({
      authClient: makeClient({
        resetPasswordForEmail: async () => ({ error: { message: 'rate limited' } }),
      }),
    });
    const result = await ui.requestPasswordReset('user@example.com', 'https://app.test/recuperar-palavra-passe/confirmar');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });
});

describe('exchangeResetCode', () => {
  it('returns idle when code exchange succeeds', async () => {
    const ui = createWebAuthUi({ authClient: makeClient() });
    const result = await ui.exchangeResetCode('valid-code');
    expect(result.state).toBe('idle');
  });

  it('returns invalid_link when exchange returns an error', async () => {
    const ui = createWebAuthUi({
      authClient: makeClient({
        exchangeCodeForSession: async () => ({ data: null, error: { message: 'invalid or expired' } }),
      }),
    });
    const result = await ui.exchangeResetCode('bad-code');
    expect(result.state).toBe('invalid_link');
  });

  it('returns invalid_link when exchange returns no session', async () => {
    const ui = createWebAuthUi({
      authClient: makeClient({
        exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
      }),
    });
    const result = await ui.exchangeResetCode('no-session-code');
    expect(result.state).toBe('invalid_link');
  });
});

describe('updatePassword', () => {
  it('returns updated on success', async () => {
    const ui = createWebAuthUi({ authClient: makeClient() });
    const result = await ui.updatePassword('nova-palavra-passe-segura');
    expect(result.state).toBe('updated');
    if (result.state === 'updated') {
      expect(result.title).toBeTruthy();
      expect(result.message).toBeTruthy();
    }
  });

  it('returns failed when updateUser returns an error', async () => {
    const ui = createWebAuthUi({
      authClient: makeClient({
        updateUser: async () => ({ error: { message: 'password too short' } }),
      }),
    });
    const result = await ui.updatePassword('123');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });
});
