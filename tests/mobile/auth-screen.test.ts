import { describe, it, expect } from 'vitest';
import {
  createMobileAuthUi,
  type SupabaseMobileAuthClientLike,
} from '../../apps/mobile/src/auth';

const makeClient = (result: {
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
}): SupabaseMobileAuthClientLike => ({
  auth: {
    signInWithPassword: async () => result,
  },
});

describe('auth screen — boundary contract', () => {
  it('produces signed_in state with accessToken on success', async () => {
    const client = makeClient({
      data: { session: { access_token: 'tok-abc' } },
      error: null,
    });
    const ui = createMobileAuthUi({ authClient: client });
    const result = await ui.signIn('user@example.com', 'secret');
    expect(result.state).toBe('signed_in');
    if (result.state === 'signed_in') {
      expect(result.accessToken).toBe('tok-abc');
    }
  });

  it('produces failed state when error returned', async () => {
    const client = makeClient({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    const ui = createMobileAuthUi({ authClient: client });
    const result = await ui.signIn('bad@example.com', 'wrong');
    expect(result.state).toBe('failed');
  });

  it('produces failed state when session is null', async () => {
    const client = makeClient({
      data: { session: null },
      error: null,
    });
    const ui = createMobileAuthUi({ authClient: client });
    const result = await ui.signIn('user@example.com', 'secret');
    expect(result.state).toBe('failed');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({
      data: null,
      error: { message: 'Bearer eyJ... service-role key leaked' },
    });
    const ui = createMobileAuthUi({ authClient: client });
    const result = await ui.signIn('bad@example.com', 'wrong');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
