# Work-Item: WEB-NOTIFICATION-001 — Web Notification Product Boundary

## 1. Context & Problem

`NOTIFICATION-CLIENT-001` added `createNotificationClient`.

The Web product layer needs a state-machine boundary that lets authenticated users
load their notification list and mark individual notifications as read, with all UI
copy in PT-PT.

## 2. Acceptance Criteria

- [ ] Web notification product boundary added.
- [ ] 4 states: `idle | loading | loaded | failed`.
- [ ] Boundary consumes injected `NotificationClient` dependency (no direct Worker calls).
- [ ] `loaded` state surfaces `notifications`, `total`, `unreadCount`, and a `markRead` action.
- [ ] `markRead(notificationId)` transitions affected notification's `readAt` optimistically and calls the client; stays in `loaded` on both success and failure.
- [ ] `failed` state surfaced when initial `listNotifications` call fails.
- [ ] All UI copy in PT-PT in `webNotificationUiContent` with `locale === 'pt-PT'` and `status === 'product-flow-ready'`.
- [ ] Boundary exposed via `apps/web/src/foundation.ts` → `webFoundationContent.notification`.
- [ ] UI-facing results never expose bearer tokens, user IDs, or server internals.
- [ ] 8 tests — failing before implementation, passing after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real browser auth session.
- Do not implement Mobile boundary (separate work item).
- Do not implement notification preferences or filtering.

## 4. Completion Notes

<!-- To be filled in when merged -->
