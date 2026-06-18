---
id: WEB-NOTIFICATION-SCREEN-001
title: Web notification list page
status: done
---

# Work-Item: WEB-NOTIFICATION-SCREEN-001 — Web Notification List Page

## Goal

Create the user notification list page at `/notificacoes` wired to `createWebNotificationUi`.
Shows all notifications with type label, date, and a mark-as-read button for unread items.

## States

- `null / idle / loading` — loading message while fetching
- `failed` — error message with retry button
- `loaded (empty)` — empty-state paragraph when no notifications exist
- `loaded` — `<ul>` of notification `<li>` items; each shows type label + date; unread items show "Marcar como lida" button

## Affected Files

- `docs/work-items/WEB-NOTIFICATION-SCREEN-001-screen.md` (this file)
- `apps/web/app/notificacoes/page.tsx` — notification list page
- `tests/web/notification-page.test.ts` — boundary contract tests

## Contract

- Import depth from `apps/web/`: 2 levels → `../../src/`
- `createNotificationClient({ notificationsPath: '/notifications', ... })`
- `ui.loadNotifications()` on mount
- `ui.markRead(currentState, notificationId)` on button click — returns new loaded state
- Unread detection: `!n.readAt`
- `NotificationClientType` mapped to PT-PT labels via `TYPE_LABELS`

## Completion Notes

3 boundary contract tests pass (loading, loaded-with-items, mark-read). Typecheck clean.
