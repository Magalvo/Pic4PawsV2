---
id: MOBILE-NOTIFICATION-SCREEN-001
title: Mobile notification list screen
status: done
---

# Work-Item: MOBILE-NOTIFICATION-SCREEN-001 — Mobile Notification List Screen

## Goal

Create the user notification list screen at `/notificacoes` wired to `createWebNotificationUi`.
Shows all notifications in reverse-chronological order with a mark-as-read button for unread items.

## States

- `null / idle / loading` — spinner while fetching
- `failed` — network error; retry button
- `loaded (empty)` — empty-state message when no notifications exist
- `loaded` — flat list of notification cards; unread cards have a teal left border; each shows type label + date; unread items show "Marcar como lida" button

## Affected Files

- `docs/work-items/MOBILE-NOTIFICATION-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/notificacoes/index.tsx` — notification list screen
- `tests/mobile/notification-screen.test.ts` — boundary contract tests

## Contract

- `createNotificationClient({ notificationsPath: '/notifications', ... })`
- `ui.loadNotifications()` on mount
- `ui.markRead(currentState, notificationId)` on button press — optimistic, returns new loaded state
- `NotificationClientType` mapped to PT-PT labels via `TYPE_LABELS`
- Unread detection: `!n.readAt`

## Completion Notes

4 boundary contract tests pass (loading, loaded-empty, loaded-with-items, mark-read). Typecheck clean.
