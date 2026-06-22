import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-notifications', () => ({
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
}));

import { createMobilePushTokenRegistrar } from '../../apps/mobile/src/push-token';

const makePushTokenClient = () => ({
  registerToken: vi.fn().mockResolvedValue({ ok: true, status: 'push_token_registered' as const }),
  unregisterToken: vi.fn().mockResolvedValue({ ok: true, status: 'push_token_removed' as const }),
});

const makePushTokenGetter = (token: string | null) => vi.fn().mockResolvedValue(token);

describe('createMobilePushTokenRegistrar — onAuthenticated', () => {
  it('calls registerToken with the expo token on sign-in', async () => {
    const client = makePushTokenClient();
    const getPushToken = makePushTokenGetter('ExponentPushToken[abc]');
    const registrar = createMobilePushTokenRegistrar({ pushTokenClient: client, getPushToken });

    await registrar.onAuthenticated();

    expect(client.registerToken).toHaveBeenCalledWith('ExponentPushToken[abc]', 'expo');
  });

  it('is a no-op when getPushToken returns null (permission denied / simulator)', async () => {
    const client = makePushTokenClient();
    const getPushToken = makePushTokenGetter(null);
    const registrar = createMobilePushTokenRegistrar({ pushTokenClient: client, getPushToken });

    await registrar.onAuthenticated();

    expect(client.registerToken).not.toHaveBeenCalled();
  });

  it('silently catches registerToken errors', async () => {
    const client = makePushTokenClient();
    client.registerToken.mockRejectedValue(new Error('network error'));
    const getPushToken = makePushTokenGetter('tok-1');
    const registrar = createMobilePushTokenRegistrar({ pushTokenClient: client, getPushToken });

    await expect(registrar.onAuthenticated()).resolves.not.toThrow();
  });

  it('stores the token so onSignedOut can unregister it', async () => {
    const client = makePushTokenClient();
    const getPushToken = makePushTokenGetter('tok-stored');
    const registrar = createMobilePushTokenRegistrar({ pushTokenClient: client, getPushToken });

    await registrar.onAuthenticated();

    // Allow registerToken fire-and-forget to settle
    await Promise.resolve();

    registrar.onSignedOut();
    await Promise.resolve();

    expect(client.unregisterToken).toHaveBeenCalledWith('tok-stored');
  });
});

describe('createMobilePushTokenRegistrar — onSignedOut', () => {
  it('calls unregisterToken with stored token', async () => {
    const client = makePushTokenClient();
    const getPushToken = makePushTokenGetter('tok-xyz');
    const registrar = createMobilePushTokenRegistrar({ pushTokenClient: client, getPushToken });

    await registrar.onAuthenticated();
    await Promise.resolve();
    registrar.onSignedOut();
    await Promise.resolve();

    expect(client.unregisterToken).toHaveBeenCalledWith('tok-xyz');
  });

  it('is a no-op when no token was registered', () => {
    const client = makePushTokenClient();
    const registrar = createMobilePushTokenRegistrar({
      pushTokenClient: client,
      getPushToken: makePushTokenGetter(null),
    });

    registrar.onSignedOut();

    expect(client.unregisterToken).not.toHaveBeenCalled();
  });

  it('silently catches unregisterToken errors', async () => {
    const client = makePushTokenClient();
    client.unregisterToken.mockRejectedValue(new Error('network error'));
    const getPushToken = makePushTokenGetter('tok-1');
    const registrar = createMobilePushTokenRegistrar({ pushTokenClient: client, getPushToken });

    await registrar.onAuthenticated();
    await Promise.resolve();

    expect(() => registrar.onSignedOut()).not.toThrow();
  });

  it('clears the stored token after sign-out so second sign-out is a no-op', async () => {
    const client = makePushTokenClient();
    const getPushToken = makePushTokenGetter('tok-1');
    const registrar = createMobilePushTokenRegistrar({ pushTokenClient: client, getPushToken });

    await registrar.onAuthenticated();
    await Promise.resolve();
    registrar.onSignedOut();
    await Promise.resolve();
    registrar.onSignedOut(); // second call

    expect(client.unregisterToken).toHaveBeenCalledTimes(1);
  });
});
