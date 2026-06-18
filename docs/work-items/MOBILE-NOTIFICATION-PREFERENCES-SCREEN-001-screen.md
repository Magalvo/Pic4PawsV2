---
id: MOBILE-NOTIFICATION-PREFERENCES-SCREEN-001
title: Mobile notification preferences screen
status: done
---

# Work-Item: MOBILE-NOTIFICATION-PREFERENCES-SCREEN-001 — Mobile Notification Preferences Screen

## Goal

Create the notification preferences screen at `/notificacoes/preferencias` wired to
`createMobileNotificationPreferencesUi`. Lets users toggle per-type notification preferences.

## States

- `null / idle` — spinner while fetching
- `failed` — network error; retry button
- `loaded` — list of preference toggles (Switch per `NotificationClientType`); toggling calls `updatePreference` optimistically and immediately updates UI

## Affected Files

- `docs/work-items/MOBILE-NOTIFICATION-PREFERENCES-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/notificacoes/preferencias.tsx` — notification preferences screen
- `tests/mobile/notification-preferences-screen.test.ts` — boundary contract tests

## Contract

- `createNotificationPreferencesClient({ notificationsPath: '/notifications', ... })`
- `ui.loadPreferences()` on mount
- `ui.updatePreference(currentState, type, enabled)` on Switch toggle — fire-and-forget; always returns loaded state (no error path)
- `NotificationClientType` mapped to PT-PT labels via `TYPE_LABELS`

## Completion Notes

4 boundary contract tests pass (loading, loaded, toggle-enabled, toggle-disabled). Typecheck clean.
