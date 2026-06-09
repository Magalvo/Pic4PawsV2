# NOTIF-PREFS-WORKER-001 — Notification Preferences Worker Route

## Goal

Allow users to view and update their notification opt-out preferences per type, so they can stop receiving specific categories of in-app notifications.

## Routes

```
GET  /notifications/preferences
PATCH /notifications/preferences
```

Both are authenticated. Path matched with exact comparison after the existing read-id matcher.

## Response shapes

```
GET 200
{ status: 'ok', preferences: NotificationPreference[] }

PATCH 200  (body: { preferences: NotificationPreference[] })
{ status: 'ok', preferences: NotificationPreference[] }

PATCH 400  (missing or invalid body)
{ status: 'invalid_body' }

401  { status: 'unauthenticated' }
405  { status: 'method_not_allowed', allowedMethods: ['GET', 'PATCH'] }
501  { status: 'notification_preferences_repository_not_configured' }
```

## Types

```typescript
NotificationPreference = { type: NotificationType; enabled: boolean }
NotificationPreferencesRepository = {
  getPreferences:    (userId: string) => Promise<{ preferences: NotificationPreference[] }>
  updatePreferences: (userId: string, preferences: NotificationPreference[]) => Promise<{ preferences: NotificationPreference[] }>
}
```

Default behaviour: all 4 types enabled. Repository returns all 4 types even if none stored.

## Path matcher

`matchWorkerNotificationPreferencesPath(pathname, notificationsPath)`  
→ `pathname === notificationsPath + '/preferences'`

## Route ordering in index.ts

1. `matchWorkerNotificationReadId` (existing — /:id/read)
2. `matchWorkerNotificationPreferencesPath` (NEW — /preferences)
3. `matchWorkerNotificationsPath` (existing — exact list)

## Files

- `apps/workers/src/notification-preferences.ts` — types, path matcher, handlers
- `apps/workers/src/notification-preferences-supabase.ts` — Supabase impl
- `apps/workers/src/dependencies.ts` — add `notificationPreferencesRepository`
- `apps/workers/src/index.ts` — wire route + barrel exports
- `tests/workers/notification-preferences.test.ts` — tests
