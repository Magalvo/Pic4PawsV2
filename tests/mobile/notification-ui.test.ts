import { describe, expect, it, vi } from 'vitest';
import {
  createMobileNotificationUi,
  mobileNotificationUiContent,
} from '../../apps/mobile/src/notification';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  NotificationClient,
  NotificationSummary,
  ListNotificationsClientResult,
} from '../../packages/client/src/index';

const makeNotification = (overrides: Partial<NotificationSummary> = {}): NotificationSummary => ({
  notificationId: 'notif-001',
  type: 'adoption_status_changed',
  payload: {},
  readAt: null,
  createdAt: '2026-01-01T12:00:00Z',
  ...overrides,
});

const makeClient = (
  listResult: ListNotificationsClientResult,
): Pick<NotificationClient, 'listNotifications' | 'markNotificationRead'> => ({
  listNotifications: vi.fn().mockResolvedValue(listResult),
  markNotificationRead: vi.fn().mockResolvedValue({
    ok: true,
    status: 'notification_marked_read',
    notificationId: 'notif-001',
  }),
});

describe('mobile notification UI', () => {
  it('getInitialState returns idle state', () => {
    const ui = createMobileNotificationUi({
      notificationClient: makeClient({
        ok: true,
        status: 'ok',
        notifications: [],
        total: 0,
        unreadCount: 0,
      }),
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
  });

  it('loadNotifications success returns loaded state with notifications', async () => {
    const notifications = [makeNotification()];
    const ui = createMobileNotificationUi({
      notificationClient: makeClient({
        ok: true,
        status: 'ok',
        notifications,
        total: 1,
        unreadCount: 1,
      }),
    });

    const state = await ui.loadNotifications();

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.notifications).toHaveLength(1);
      expect(state.total).toBe(1);
      expect(state.unreadCount).toBe(1);
    }
  });

  it('loadNotifications failure returns failed state', async () => {
    const ui = createMobileNotificationUi({
      notificationClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadNotifications();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.message).toBeTruthy();
    }
  });

  it('markRead updates readAt for the matching notification', async () => {
    const notif = makeNotification({ notificationId: 'notif-001', readAt: null });
    const client = makeClient({
      ok: true,
      status: 'ok',
      notifications: [notif],
      total: 1,
      unreadCount: 1,
    });
    const ui = createMobileNotificationUi({ notificationClient: client });
    const loadedState = await ui.loadNotifications();

    if (loadedState.state !== 'loaded') throw new Error('Expected loaded state');

    const updatedState = await ui.markRead(loadedState, 'notif-001');

    expect(updatedState.state).toBe('loaded');
    if (updatedState.state === 'loaded') {
      const updatedNotif = updatedState.notifications.find((n) => n.notificationId === 'notif-001');
      expect(updatedNotif?.readAt).not.toBeNull();
    }
  });

  it('markRead decrements unreadCount for unread notification', async () => {
    const notif = makeNotification({ notificationId: 'notif-001', readAt: null });
    const client = makeClient({
      ok: true,
      status: 'ok',
      notifications: [notif],
      total: 1,
      unreadCount: 1,
    });
    const ui = createMobileNotificationUi({ notificationClient: client });
    const loadedState = await ui.loadNotifications();

    if (loadedState.state !== 'loaded') throw new Error('Expected loaded state');

    const updatedState = await ui.markRead(loadedState, 'notif-001');

    if (updatedState.state === 'loaded') {
      expect(updatedState.unreadCount).toBe(0);
    }
  });

  it('markRead does not change unreadCount for already-read notification', async () => {
    const notif = makeNotification({ notificationId: 'notif-001', readAt: '2026-01-01T00:00:00Z' });
    const client = makeClient({
      ok: true,
      status: 'ok',
      notifications: [notif],
      total: 1,
      unreadCount: 0,
    });
    const ui = createMobileNotificationUi({ notificationClient: client });
    const loadedState = await ui.loadNotifications();

    if (loadedState.state !== 'loaded') throw new Error('Expected loaded state');

    const updatedState = await ui.markRead(loadedState, 'notif-001');

    if (updatedState.state === 'loaded') {
      expect(updatedState.unreadCount).toBe(0);
    }
  });

  it('mobileNotificationUiContent locale is pt-PT', () => {
    expect(mobileNotificationUiContent.locale).toBe('pt-PT');
  });

  it('mobileNotificationUiContent status is product-flow-ready', () => {
    expect(mobileNotificationUiContent.status).toBe('product-flow-ready');
  });

  it('mobile foundation content exposes notification with product-flow-ready status', () => {
    expect(mobileFoundationContent.notification.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.notification.title).toBeTruthy();
    expect(mobileFoundationContent.notification.description).toBeTruthy();
  });
});
