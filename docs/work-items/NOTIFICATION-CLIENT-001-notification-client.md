# Work-Item: NOTIFICATION-CLIENT-001 — Notification Client

## 1. Context & Problem

`NOTIFICATION-WORKER-001` added the Worker routes for listing and marking notifications.

The shared client package needs `createNotificationClient` so that both Web and Mobile
product boundaries can consume notifications without coupling directly to the Worker API.

## 2. Acceptance Criteria

- [ ] `NotificationSummary` type defined with `notificationId`, `type`, `payload`, `readAt`, `createdAt`.
- [ ] `ListNotificationsClientSuccess` type defined.
- [ ] `ListNotificationsClientFailureStatus` union defined (7 statuses).
- [ ] `ListNotificationsClientResult` discriminated union defined.
- [ ] `MarkNotificationReadClientSuccess` type defined.
- [ ] `MarkNotificationReadClientFailureStatus` union defined (6 statuses).
- [ ] `MarkNotificationReadClientResult` discriminated union defined.
- [ ] `CreateNotificationClientInput` type defined with `workerBaseUrl`, `notificationsPath`, `getAccessToken`, `fetch`.
- [ ] `NotificationClient` type defined with `listNotifications(query)` and `markNotificationRead(notificationId)` methods.
- [ ] `createNotificationClient` factory exported from `@pic4paws/client`.
- [ ] `listNotifications` maps `{ ok: true, notifications, total, unreadCount }` on success.
- [ ] `markNotificationRead` maps `{ ok: true, status: 'notification_marked_read' }` on 200.
- [ ] `markNotificationRead` maps `{ ok: false, status: 'notification_not_found' }` on 404.
- [ ] Both methods map unauthenticated / network / malformed-response failure statuses.
- [ ] All types and factory exported from `packages/client/src/index.ts`.
- [ ] 10 tests — failing before implementation, passing after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement product boundaries in this item.
- Do not add pagination helpers beyond `limit` / `offset` query params.

## 4. Completion Notes

Implemented in commit `5c175d1` on branch `agent/notifications-batch`.

- `packages/client/src/index.ts` — appended `NotificationClientType`, `NotificationSummary`, `ListNotificationsClientSuccess`, `ListNotificationsClientFailureStatus`, `ListNotificationsClientResult`, `MarkNotificationReadClientSuccess`, `MarkNotificationReadClientFailureStatus`, `MarkNotificationReadClientResult`, `CreateNotificationClientInput`, `NotificationClient`, and `createNotificationClient` factory.
- `tests/client/notification-client.test.ts` — 10 tests covering list success, list auth failure, list 501 variants, mark-read success, mark-read 404, mark-read auth failure, mark-read network failure.
