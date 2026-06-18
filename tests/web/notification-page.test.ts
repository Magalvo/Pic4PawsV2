import { describe, it, expect } from 'vitest';
import { createWebNotificationUi } from '../../apps/web/src/notification';
import type { NotificationClient, ListNotificationsClientResult } from '@pic4paws/client';

const makeClient = (
  result: ListNotificationsClientResult,
): Pick<NotificationClient, 'listNotifications' | 'markNotificationRead'> => ({
  listNotifications: async () => result,
  markNotificationRead: async () => ({ ok: true, status: 'notification_marked_read' as const, notificationId: 'n-001' }),
});

const notification = {
  notificationId: 'n-001',
  type: 'donation_paid' as const,
  readAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  payload: {},
};

describe('web notification page — boundary contract', () => {
  it('produces loaded state with notifications', async () => {
    const client = makeClient({ ok: true, status: 'ok', notifications: [notification], total: 1, unreadCount: 1 });
    const ui = createWebNotificationUi({ notificationClient: client });
    const result = await ui.loadNotifications();
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') expect(result.notifications[0].notificationId).toBe('n-001');
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebNotificationUi({ notificationClient: client });
    const result = await ui.loadNotifications();
    expect(result.state).toBe('failed');
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: true, status: 'ok', notifications: [], total: 0, unreadCount: 0 });
    const ui = createWebNotificationUi({ notificationClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });
});
