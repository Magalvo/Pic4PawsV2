# NOTIF-PREFS-DISPATCH-001 — Notification Dispatch Gating

## Goal

Make `notifyXxx` dispatch methods in the Supabase notification repository respect the user's
notification preferences before inserting. Without this, preferences are stored but have no
effect on what notifications are delivered.

## Design

Inject `notificationPreferencesRepository` (optional) into `createSupabaseNotificationRepositories`.
Before each notification insert, call `getPreferences(userId)` for the recipient and skip the
insert if the relevant type has `enabled: false`.

`notifyNewAdoptionApplication` fans out to multiple shelter members — each member is checked
individually and only opted-in members receive the notification.

If `notificationPreferencesRepository` is not provided, all notifications are dispatched as
before (backwards-compatible default).

## Affected files

- `apps/workers/src/notification-supabase.ts` — add `notificationPreferencesRepository` param,
  gate each `notifyXxx` with `isOptedOut(userId, type)` helper
- `apps/workers/src/dependencies.ts` — pass `notificationPreferencesRepository` when constructing
  the notification repositories (create preferences repo first)
- `tests/workers/notification-dispatch-gating.test.ts` — 7 tests covering opt-out/in per event type

## No new routes, types, or client changes needed.
