---
id: MOBILE-NOTIF-PREFS-001
title: Mobile notification preferences product boundary
status: done
pr: 108
---

## Goal

Mobile product boundary for notification preferences, mirroring `WEB-NOTIF-PREFS-001`.

## States

`idle | loaded { preferences[] } | failed { message }`

## Contract

```typescript
createMobileNotificationPreferencesUi({ notificationPreferencesClient })
  .getInitialState()                           → idle
  .loadPreferences()                           → loaded | failed
  .updatePreference(currentState, type, enabled) → optimistic loaded (fire-and-forget PATCH)
```

## Affected files

- `apps/mobile/src/notification-preferences.ts`
- `apps/mobile/src/foundation.ts` — notificationPreferences entry
- `tests/mobile/notification-preferences-ui.test.ts`
