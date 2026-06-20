import { describe, it, expect } from 'vitest';
import { createMobileAuthUi } from '../../apps/mobile/src/auth';

const makeClient = (overrides: Record<string, unknown> = {}) => ({
  auth: {
    signInWithPassword: async () => ({ data: null, error: { message: 'unused' } }),
    resetPasswordForEmail: async () => ({ error: null }),
    ...overrides,
  },
});

describe('requestPasswordReset (mobile)', () => {
  it('returns email_sent on success', async () => {
    const ui = createMobileAuthUi({ authClient: makeClient() });
    const result = await ui.requestPasswordReset(
      'user@example.com',
      'https://pic4paws.pt/recuperar-palavra-passe/confirmar',
    );
    expect(result.state).toBe('email_sent');
    if (result.state === 'email_sent') {
      expect(result.title).toBeTruthy();
      expect(result.message).toBeTruthy();
    }
  });

  it('returns failed when Supabase returns an error', async () => {
    const ui = createMobileAuthUi({
      authClient: makeClient({
        resetPasswordForEmail: async () => ({ error: { message: 'rate limited' } }),
      }),
    });
    const result = await ui.requestPasswordReset(
      'user@example.com',
      'https://pic4paws.pt/recuperar-palavra-passe/confirmar',
    );
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.canRetry).toBe(true);
  });

  it('failed state does not expose bearer or service-role', async () => {
    const ui = createMobileAuthUi({
      authClient: makeClient({
        resetPasswordForEmail: async () => ({ error: { message: 'Bearer eyJ... service-role key leaked' } }),
      }),
    });
    const result = await ui.requestPasswordReset(
      'bad@example.com',
      'https://pic4paws.pt/recuperar-palavra-passe/confirmar',
    );
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
