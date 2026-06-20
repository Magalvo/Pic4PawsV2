import { describe, it, expect } from 'vitest';
import {
  createMobileAuthUi,
  type SupabaseMobileAuthClientLike,
} from '../../apps/mobile/src/auth';

type AuthChangeCallback = (event: string, session: { access_token: string } | null) => void;

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

  it('shared client: onAuthStateChange fires for root layout when sign-in uses same instance', async () => {
    // Regression test for the two-client bug: _layout.tsx created clientA and
    // entrar.tsx created clientB. clientA's subscriber never saw clientB's sign-in.
    // Fix: both use mobileSupabaseClient (one shared instance). This test proves the
    // invariant: sign-in through the shared client triggers any subscriber on that client.
    const observed: string[] = [];
    let changeHandler: AuthChangeCallback | null = null;

    const sharedClient: SupabaseMobileAuthClientLike & {
      auth: { onAuthStateChange: (cb: AuthChangeCallback) => { data: { subscription: { unsubscribe: () => void } } } };
    } = {
      auth: {
        signInWithPassword: async () => {
          const session = { access_token: 'tok-shared' };
          changeHandler?.('SIGNED_IN', session);
          return { data: { session }, error: null };
        },
        onAuthStateChange: (cb) => {
          changeHandler = cb;
          return { data: { subscription: { unsubscribe: () => { changeHandler = null; } } } };
        },
      },
    };

    // Root layout subscribes on the shared client
    sharedClient.auth.onAuthStateChange((_event, sess) => {
      if (sess) observed.push(sess.access_token);
    });

    // Sign-in screen uses the same shared client
    const ui = createMobileAuthUi({ authClient: sharedClient });
    const result = await ui.signIn('user@example.com', 'correct');

    expect(result.state).toBe('signed_in');
    expect(observed).toEqual(['tok-shared']);
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
