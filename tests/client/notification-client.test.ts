import { describe, expect, it, vi } from 'vitest';
import { createNotificationClient } from '../../packages/client/src/index';
import type {
  NotificationClient,
  MediaUploadClientFetch,
} from '../../packages/client/src/index';

const workerBaseUrl = 'https://workers.pic4paws.pt';
const notificationsPath = '/notifications' as const;

const makeFetch = (
  status: number,
  body: Record<string, unknown>,
): MediaUploadClientFetch =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });

const throwingFetch: MediaUploadClientFetch = vi.fn().mockRejectedValue(
  new Error('Network error'),
);

const makeClient = (
  fetch: MediaUploadClientFetch,
  token: string | null = 'valid-token',
): NotificationClient =>
  createNotificationClient({
    workerBaseUrl,
    notificationsPath,
    getAccessToken: async () => token,
    fetch,
  });

const sampleNotifications = [
  {
    notificationId: 'notif-001',
    type: 'adoption_status_changed',
    payload: { applicationId: 'app-001', newStatus: 'approved' },
    readAt: null,
    createdAt: '2026-01-01T12:00:00.000Z',
  },
];

describe('createNotificationClient', () => {
  describe('listNotifications', () => {
    it('returns ok result with notifications on 200', async () => {
      const client = makeClient(
        makeFetch(200, {
          status: 'ok',
          notifications: sampleNotifications,
          total: 1,
          unreadCount: 1,
        }),
      );
      const result = await client.listNotifications();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.status).toBe('ok');
        expect(result.notifications).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.unreadCount).toBe(1);
      }
    });

    it('sends limit and offset as query params', async () => {
      const fetchFn = makeFetch(200, {
        status: 'ok',
        notifications: [],
        total: 0,
        unreadCount: 0,
      });
      const client = makeClient(fetchFn);
      await client.listNotifications({ limit: 10, offset: 20 });

      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=20');
    });

    it('returns unauthenticated when getAccessToken returns null', async () => {
      const client = makeClient(makeFetch(200, {}), null);
      const result = await client.listNotifications();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('unauthenticated');
      }
    });

    it('returns unauthenticated on 401 response', async () => {
      const client = makeClient(makeFetch(401, { status: 'unauthenticated' }));
      const result = await client.listNotifications();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('unauthenticated');
      }
    });

    it('returns worker_request_failed on network error', async () => {
      const client = makeClient(throwingFetch);
      const result = await client.listNotifications();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('worker_request_failed');
      }
    });

    it('returns worker_response_invalid on malformed 200', async () => {
      const client = makeClient(makeFetch(200, { status: 'ok' })); // missing notifications
      const result = await client.listNotifications();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('worker_response_invalid');
      }
    });
  });

  describe('markNotificationRead', () => {
    it('returns ok on 200', async () => {
      const client = makeClient(
        makeFetch(200, { status: 'notification_marked_read', notificationId: 'notif-001' }),
      );
      const result = await client.markNotificationRead('notif-001');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.status).toBe('notification_marked_read');
        expect(result.notificationId).toBe('notif-001');
      }
    });

    it('returns notification_not_found on 404', async () => {
      const client = makeClient(makeFetch(404, { status: 'notification_not_found' }));
      const result = await client.markNotificationRead('notif-999');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('notification_not_found');
      }
    });

    it('returns unauthenticated when getAccessToken returns null', async () => {
      const client = makeClient(makeFetch(200, {}), null);
      const result = await client.markNotificationRead('notif-001');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('unauthenticated');
      }
    });

    it('returns worker_request_failed on network error', async () => {
      const client = makeClient(throwingFetch);
      const result = await client.markNotificationRead('notif-001');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe('worker_request_failed');
      }
    });
  });
});
