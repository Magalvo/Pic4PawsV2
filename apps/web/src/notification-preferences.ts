import type {
  NotificationPreferencesClient,
  NotificationPreferenceItem,
} from '@pic4paws/client';

export type WebNotificationPreferencesUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
  failedMessage: string;
  typeLabels: Record<string, string>;
};

export const webNotificationPreferencesUiContent: WebNotificationPreferencesUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Preferências de notificações',
  description: 'Escolhe quais notificações pretendes receber.',
  loadingMessage: 'A carregar preferências…',
  failedMessage: 'Não foi possível carregar as preferências.',
  typeLabels: {
    adoption_status_changed: 'Alteração de estado de adoção',
    new_adoption_application: 'Nova candidatura de adoção',
    donation_paid: 'Donativo confirmado',
    sponsorship_status_changed: 'Alteração de estado de apadrinhamento',
  },
};

export type WebNotificationPreferencesIdleState = {
  state: 'idle';
};

export type WebNotificationPreferencesLoadedState = {
  state: 'loaded';
  preferences: NotificationPreferenceItem[];
};

export type WebNotificationPreferencesFailedState = {
  state: 'failed';
  message: string;
};

export type WebNotificationPreferencesState =
  | WebNotificationPreferencesIdleState
  | WebNotificationPreferencesLoadedState
  | WebNotificationPreferencesFailedState;

export type CreateWebNotificationPreferencesUiInput = {
  notificationPreferencesClient: Pick<
    NotificationPreferencesClient,
    'loadPreferences' | 'updatePreferences'
  >;
};

export const createWebNotificationPreferencesUi = ({
  notificationPreferencesClient,
}: CreateWebNotificationPreferencesUiInput) => ({
  getInitialState: (): WebNotificationPreferencesIdleState => ({ state: 'idle' }),

  loadPreferences: async (): Promise<WebNotificationPreferencesState> => {
    const result = await notificationPreferencesClient.loadPreferences();

    if (!result.ok) {
      return {
        state: 'failed',
        message: webNotificationPreferencesUiContent.failedMessage,
      };
    }

    return { state: 'loaded', preferences: result.preferences };
  },

  updatePreference: async (
    currentState: WebNotificationPreferencesLoadedState,
    type: string,
    enabled: boolean,
  ): Promise<WebNotificationPreferencesLoadedState> => {
    const updatedPreferences = currentState.preferences.map((p) =>
      p.type === type ? { ...p, enabled } : p,
    );

    const nextState: WebNotificationPreferencesLoadedState = {
      state: 'loaded',
      preferences: updatedPreferences,
    };

    notificationPreferencesClient
      .updatePreferences(updatedPreferences)
      .catch(() => undefined);

    return nextState;
  },
});
