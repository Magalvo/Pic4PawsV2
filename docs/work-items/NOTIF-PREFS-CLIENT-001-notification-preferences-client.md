---
id: NOTIF-PREFS-CLIENT-001
title: Notification preferences client
status: done
pr: 106
---

## Goal

Add `createNotificationPreferencesClient` to `@pic4paws/client` wrapping the
authenticated `GET /notifications/preferences` and `PATCH /notifications/preferences`
routes added in `NOTIF-PREFS-WORKER-001`.

## Contract

```typescript
createNotificationPreferencesClient({ workerBaseUrl, notificationsPath, getAccessToken, fetch })
  .loadPreferences()    → LoadNotificationPreferencesClientResult
  .updatePreferences(preferences) → UpdateNotificationPreferencesClientResult
```

- URL: `createWorkerSubUrl(workerBaseUrl, notificationsPath, 'preferences')`
- GET loads current preferences, PATCH updates them

## Affected files

- `packages/client/src/index.ts` — NotificationPreferencesClient types + factory
- `tests/client/notification-preferences-client.test.ts`
