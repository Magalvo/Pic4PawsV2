# Work-Item: MOBILE-NOTIFICATION-001 — Mobile Notification Product Boundary

## 1. Context & Problem

`NOTIFICATION-CLIENT-001` added `createNotificationClient`.
`WEB-NOTIFICATION-001` added the Web boundary.

The Mobile product layer needs its own state-machine boundary mirroring the Web boundary,
adapted for mobile UX conventions and PT-PT copy prefixed with `Mobile`.

## 2. Acceptance Criteria

- [ ] Mobile notification product boundary added.
- [ ] 4 states: `idle | loading | loaded | failed`.
- [ ] Boundary consumes injected `NotificationClient` dependency (no direct Worker calls).
- [ ] `loaded` state surfaces `notifications`, `total`, `unreadCount`, and a `markRead` action.
- [ ] `markRead(notificationId)` transitions affected notification's `readAt` optimistically and calls the client; stays in `loaded` on both success and failure.
- [ ] `failed` state surfaced when initial `listNotifications` call fails.
- [ ] All UI copy in PT-PT in `mobileNotificationUiContent` with `locale === 'pt-PT'` and `status === 'product-flow-ready'`.
- [ ] Boundary exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.notification`.
- [ ] UI-facing results never expose bearer tokens, user IDs, or server internals.
- [ ] 8 tests — failing before implementation, passing after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real React Native auth session.
- Do not implement Web boundary (separate work item).
- Do not implement notification preferences or filtering.

## 4. Completion Notes

Implemented in commit `7e0f1bd` on branch `agent/notifications-batch`.

- `apps/mobile/src/notification.ts` — `MobileNotificationUiContent`, `mobileNotificationUiContent` (PT-PT, `status: 'product-flow-ready'`), 4 state types (`idle | loading | loaded | failed`), `createMobileNotificationUi` factory with `getInitialState`, `loadNotifications`, and `markRead` (optimistic readAt update + fire-and-forget client call).
- `apps/mobile/src/foundation.ts` — added import, `notification: Pick<MobileNotificationUiContent, 'title' | 'description' | 'status'>` type entry, and value entry.
- `tests/mobile/notification-ui.test.ts` — 9 tests: idle state, loaded state, failed state, markRead readAt update, markRead unreadCount decrement, markRead no-op for already-read, locale, status, foundation registration.
