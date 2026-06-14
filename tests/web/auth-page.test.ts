import { describe, it, expect } from 'vitest';
import { createWebAuthUi } from '../../apps/web/src/auth';
import type { SupabaseBrowserAuthClientLike } from '../../apps/web/src/auth';

const failedAuthClient: SupabaseBrowserAuthClientLike = {
  auth: {
    signInWithPassword: async () => ({
      data: null,
      error: { message: 'Invalid login credentials' },
    }),
  },
};

const successAuthClient: SupabaseBrowserAuthClientLike = {
  auth: {
    signInWithPassword: async () => ({
      data: { session: { access_token: 'tok-abc-123' } },
      error: null,
    }),
  },
};

describe('auth page — boundary contract', () => {
  it('produces failed state when credentials are invalid', async () => {
    const ui = createWebAuthUi({ authClient: failedAuthClient });
    const result = await ui.signIn('user@example.com', 'wrong-password');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces signed_in state with accessToken on success', async () => {
    const ui = createWebAuthUi({ authClient: successAuthClient });
    const result = await ui.signIn('user@example.com', 'correct-password');
    expect(result.state).toBe('signed_in');
    if (result.state === 'signed_in') {
      expect(result.accessToken).toBe('tok-abc-123');
    }
  });

  it('passes email and password to authClient.signInWithPassword', async () => {
    const seen: Array<{ email: string; password: string }> = [];
    const trackingClient: SupabaseBrowserAuthClientLike = {
      auth: {
        signInWithPassword: async (credentials) => {
          seen.push(credentials);
          return { data: null, error: { message: 'Invalid login credentials' } };
        },
      },
    };
    const ui = createWebAuthUi({ authClient: trackingClient });
    await ui.signIn('test@pic4paws.pt', 'secret-pass');
    expect(seen).toEqual([{ email: 'test@pic4paws.pt', password: 'secret-pass' }]);
  });
});
