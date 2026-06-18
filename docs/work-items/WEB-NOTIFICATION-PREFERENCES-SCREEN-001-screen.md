---
id: WEB-NOTIFICATION-PREFERENCES-SCREEN-001
title: Web notification preferences page
status: done
---

# Work-Item: WEB-NOTIFICATION-PREFERENCES-SCREEN-001 — Web Notification Preferences Page

## Goal

Create the notification preferences page at `/notificacoes/preferencias` wired to
`createWebNotificationPreferencesUi`. Lets users toggle per-type notification preferences.

## States

- `null / idle` — loading message while fetching
- `failed` — error message with retry button
- `loaded` — `<ul>` of preference rows, one checkbox per `NotificationClientType`; toggling calls `updatePreference` optimistically

## Affected Files

- `docs/work-items/WEB-NOTIFICATION-PREFERENCES-SCREEN-001-screen.md` (this file)
- `apps/web/app/notificacoes/preferencias/page.tsx` — notification preferences page
- `tests/web/notification-preferences-page.test.ts` — boundary contract tests

## Contract

- Import depth from `apps/web/`: 3 levels → `../../../src/`
- `createNotificationPreferencesClient({ notificationsPath: '/notifications', ... })`
- `ui.loadPreferences()` on mount
- `ui.updatePreference(currentState, type, enabled)` on checkbox change — always returns loaded state (optimistic, no error path)
- `NotificationClientType` mapped to PT-PT labels via `TYPE_LABELS`

## Completion Notes

3 boundary contract tests pass (loading, loaded, toggle). Typecheck clean.
