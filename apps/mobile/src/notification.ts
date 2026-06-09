import type { NotificationClient, NotificationSummary } from '@pic4paws/client';

// ─── UI content ───────────────────────────────────────────────────────────────

export type MobileNotificationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
  emptyMessage: string;
  failedMessage: string;
  markReadLabel: string;
};

export const mobileNotificationUiContent: MobileNotificationUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Notificações',
  description: 'As suas notificações de atividade',
  loadingMessage: 'A carregar notificações…',
  emptyMessage: 'Sem notificações',
  failedMessage: 'Não foi possível carregar as notificações.',
  markReadLabel: 'Marcar como lida',
};

// ─── State types ──────────────────────────────────────────────────────────────

export type MobileNotificationIdleState = {
  state: 'idle';
};

export type MobileNotificationLoadingState = {
  state: 'loading';
  message: string;
};

export type MobileNotificationLoadedState = {
  state: 'loaded';
  notifications: NotificationSummary[];
  total: number;
  unreadCount: number;
};

export type MobileNotificationFailedState = {
  state: 'failed';
  message: string;
};

export type MobileNotificationState =
  | MobileNotificationIdleState
  | MobileNotificationLoadingState
  | MobileNotificationLoadedState
  | MobileNotificationFailedState;

// ─── UI factory ───────────────────────────────────────────────────────────────

export type CreateMobileNotificationUiInput = {
  notificationClient: Pick<NotificationClient, 'listNotifications' | 'markNotificationRead'>;
};

export const createMobileNotificationUi = ({
  notificationClient,
}: CreateMobileNotificationUiInput) => ({
  getInitialState: (): MobileNotificationIdleState => ({
    state: 'idle',
  }),

  loadNotifications: async (): Promise<MobileNotificationState> => {
    const result = await notificationClient.listNotifications({ limit: 20, offset: 0 });

    if (!result.ok) {
      return {
        state: 'failed',
        message: mobileNotificationUiContent.failedMessage,
      };
    }

    return {
      state: 'loaded',
      notifications: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
    };
  },

  markRead: async (
    currentState: MobileNotificationLoadedState,
    notificationId: string,
  ): Promise<MobileNotificationLoadedState> => {
    const wasUnread = currentState.notifications.some(
      (n) => n.notificationId === notificationId && n.readAt === null,
    );

    const updatedNotifications = currentState.notifications.map((n) =>
      n.notificationId === notificationId ? { ...n, readAt: new Date().toISOString() } : n,
    );

    const updatedState: MobileNotificationLoadedState = {
      state: 'loaded',
      notifications: updatedNotifications,
      total: currentState.total,
      unreadCount: wasUnread
        ? Math.max(0, currentState.unreadCount - 1)
        : currentState.unreadCount,
    };

    notificationClient.markNotificationRead(notificationId).catch(() => undefined);

    return updatedState;
  },
});
