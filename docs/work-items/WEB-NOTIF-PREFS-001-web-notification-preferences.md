---
id: WEB-NOTIF-PREFS-001
title: Web notification preferences product boundary
status: done
pr: 107
---

## Goal

Web product boundary for viewing and toggling per-type notification preferences.

## States

`idle | loaded { preferences[] } | failed { message }`

## Contract

```typescript
createWebNotificationPreferencesUi({ notificationPreferencesClient })
  .getInitialState()                           → idle
  .loadPreferences()                           → loaded | failed
  .updatePreference(currentState, type, enabled) → optimistic loaded (fire-and-forget PATCH)
```

- Optimistic update: returns updated state immediately, calls PATCH in background
- Content locale: pt-PT, status: product-flow-ready

## Affected files

- `apps/web/src/notification-preferences.ts`
- `apps/web/src/foundation.ts` — notificationPreferences entry
- `tests/web/notification-preferences-ui.test.ts`
