import type { NotificationClient, NotificationSummary } from '@pic4paws/client';

// ─── UI content ───────────────────────────────────────────────────────────────

export type WebNotificationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
  emptyMessage: string;
  failedMessage: string;
  markReadLabel: string;
};

export const webNotificationUiContent: WebNotificationUiContent = {
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

export type WebNotificationIdleState = {
  state: 'idle';
};

export type WebNotificationLoadingState = {
  state: 'loading';
  message: string;
};

export type WebNotificationLoadedState = {
  state: 'loaded';
  notifications: NotificationSummary[];
  total: number;
  unreadCount: number;
};

export type WebNotificationFailedState = {
  state: 'failed';
  message: string;
};

export type WebNotificationState =
  | WebNotificationIdleState
  | WebNotificationLoadingState
  | WebNotificationLoadedState
  | WebNotificationFailedState;

// ─── UI factory ───────────────────────────────────────────────────────────────

export type CreateWebNotificationUiInput = {
  notificationClient: Pick<NotificationClient, 'listNotifications' | 'markNotificationRead'>;
};

export const createWebNotificationUi = ({
  notificationClient,
}: CreateWebNotificationUiInput) => ({
  getInitialState: (): WebNotificationIdleState => ({
    state: 'idle',
  }),

  loadNotifications: async (): Promise<WebNotificationState> => {
    const result = await notificationClient.listNotifications({ limit: 20, offset: 0 });

    if (!result.ok) {
      return {
        state: 'failed',
        message: webNotificationUiContent.failedMessage,
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
    currentState: WebNotificationLoadedState,
    notificationId: string,
  ): Promise<WebNotificationLoadedState> => {
    const wasUnread = currentState.notifications.some(
      (n) => n.notificationId === notificationId && n.readAt === null,
    );

    const updatedNotifications = currentState.notifications.map((n) =>
      n.notificationId === notificationId ? { ...n, readAt: new Date().toISOString() } : n,
    );

    const updatedState: WebNotificationLoadedState = {
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
