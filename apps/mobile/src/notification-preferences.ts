import type {
  NotificationPreferencesClient,
  NotificationPreferenceItem,
} from '@pic4paws/client';

export type MobileNotificationPreferencesUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
  failedMessage: string;
  typeLabels: Record<string, string>;
};

export const mobileNotificationPreferencesUiContent: MobileNotificationPreferencesUiContent = {
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

export type MobileNotificationPreferencesIdleState = {
  state: 'idle';
};

export type MobileNotificationPreferencesLoadedState = {
  state: 'loaded';
  preferences: NotificationPreferenceItem[];
};

export type MobileNotificationPreferencesFailedState = {
  state: 'failed';
  message: string;
};

export type MobileNotificationPreferencesState =
  | MobileNotificationPreferencesIdleState
  | MobileNotificationPreferencesLoadedState
  | MobileNotificationPreferencesFailedState;

export type CreateMobileNotificationPreferencesUiInput = {
  notificationPreferencesClient: Pick<
    NotificationPreferencesClient,
    'loadPreferences' | 'updatePreferences'
  >;
};

export const createMobileNotificationPreferencesUi = ({
  notificationPreferencesClient,
}: CreateMobileNotificationPreferencesUiInput) => ({
  getInitialState: (): MobileNotificationPreferencesIdleState => ({ state: 'idle' }),

  loadPreferences: async (): Promise<MobileNotificationPreferencesState> => {
    const result = await notificationPreferencesClient.loadPreferences();

    if (!result.ok) {
      return {
        state: 'failed',
        message: mobileNotificationPreferencesUiContent.failedMessage,
      };
    }

    return { state: 'loaded', preferences: result.preferences };
  },

  updatePreference: async (
    currentState: MobileNotificationPreferencesLoadedState,
    type: string,
    enabled: boolean,
  ): Promise<MobileNotificationPreferencesLoadedState> => {
    const updatedPreferences = currentState.preferences.map((p) =>
      p.type === type ? { ...p, enabled } : p,
    );

    const nextState: MobileNotificationPreferencesLoadedState = {
      state: 'loaded',
      preferences: updatedPreferences,
    };

    notificationPreferencesClient
      .updatePreferences(updatedPreferences)
      .catch(() => undefined);

    return nextState;
  },
});
