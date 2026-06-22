import * as Notifications from 'expo-notifications';
import type { PushTokenClient } from '@pic4paws/client';

// ─── Expo push token retrieval ────────────────────────────────────────────────

export const getPushToken = async (): Promise<string | null> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
};

// ─── Registrar factory ────────────────────────────────────────────────────────

export type MobilePushTokenRegistrar = {
  onAuthenticated: () => Promise<void>;
  onSignedOut: () => void;
};

export type CreateMobilePushTokenRegistrarInput = {
  pushTokenClient: Pick<PushTokenClient, 'registerToken' | 'unregisterToken'>;
  getPushToken: () => Promise<string | null>;
};

export const createMobilePushTokenRegistrar = ({
  pushTokenClient,
  getPushToken: fetchPushToken,
}: CreateMobilePushTokenRegistrarInput): MobilePushTokenRegistrar => {
  let storedToken: string | null = null;

  return {
    onAuthenticated: async () => {
      const token = await fetchPushToken();
      if (!token) return;
      storedToken = token;
      pushTokenClient.registerToken(token, 'expo').catch(() => undefined);
    },

    onSignedOut: () => {
      const token = storedToken;
      if (!token) return;
      storedToken = null;
      pushTokenClient.unregisterToken(token).catch(() => undefined);
    },
  };
};
