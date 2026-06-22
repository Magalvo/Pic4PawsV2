---
id: MOBILE-PUSH-001
status: done
---

# MOBILE-PUSH-001 — Mobile Push Token Registration

## Goal

Request Expo push notification permission and register the device token with the Worker
(`POST /notifications/push-token`) whenever a user authenticates in the mobile app. Unregister
the token (`DELETE /notifications/push-token`) on sign-out so tokens don't accumulate.

Uses `expo-notifications` to retrieve the Expo push token. The `createMobilePushTokenRegistrar`
factory is dependency-injected (testable), keeping the Expo SDK call isolated in a thin wrapper.

## States / Events

| Auth event | Action |
|---|---|
| `INITIAL_SESSION` (existing session on launch) | Get token → register (fire-and-forget) |
| `SIGNED_IN` (fresh sign-in) | Get token → register (fire-and-forget) |
| `SIGNED_OUT` | Unregister stored token (fire-and-forget) |
| `getPushToken` returns null (permission denied / simulator) | No registration — silently skipped |
| `registerToken` / `unregisterToken` failure | Silently caught — never propagates |

## Contract

```ts
type MobilePushTokenRegistrar = {
  onAuthenticated: () => Promise<void>;  // handles INITIAL_SESSION + SIGNED_IN
  onSignedOut: () => void;               // handles SIGNED_OUT
};

type CreateMobilePushTokenRegistrarInput = {
  pushTokenClient: Pick<PushTokenClient, 'registerToken' | 'unregisterToken'>;
  getPushToken: () => Promise<string | null>;
};

// createMobilePushTokenRegistrar(input): MobilePushTokenRegistrar
// getPushToken(): Promise<string | null>   — Expo SDK call, wrapped in try/catch
```

## Affected files

- `docs/work-items/MOBILE-PUSH-001-mobile-push.md` (this file)
- `apps/mobile/package.json` — add `expo-notifications`
- `apps/mobile/src/push-token.ts` (new) — `createMobilePushTokenRegistrar`, `getPushToken`
- `apps/mobile/app/_layout.tsx` — wire registrar into `onAuthStateChange` event handler
- `tests/mobile/push-token-registrar.test.ts` (new)

## Acceptance criteria

- [x] `expo-notifications` added to `apps/mobile/package.json`
- [x] `getPushToken()` requests permission; returns Expo token string or null (on denial/simulator)
- [x] `onAuthenticated` gets the token, stores it internally, calls `registerToken(token, 'expo')` fire-and-forget
- [x] `onAuthenticated` is a no-op when `getPushToken()` returns null
- [x] `onSignedOut` calls `unregisterToken` with the stored token fire-and-forget, then clears it
- [x] `onSignedOut` is a no-op when no token was stored
- [x] `registerToken` / `unregisterToken` errors are silently caught
- [x] `_layout.tsx` calls `onAuthenticated` on `INITIAL_SESSION` (with session) and `SIGNED_IN`
- [x] `_layout.tsx` calls `onSignedOut` on `SIGNED_OUT`
- [x] `npm run typecheck`, `lint`, `test`, `build` all pass
