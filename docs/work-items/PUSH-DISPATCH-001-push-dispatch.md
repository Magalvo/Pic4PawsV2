---
id: PUSH-DISPATCH-001
status: done
---

# PUSH-DISPATCH-001 — Push Notification Dispatch

## Goal

Wire an optional `PushNotificationProvider` interface into `createSupabaseNotificationRepositories`
so that whenever an in-DB notification is inserted, a fire-and-forget push notification is also
dispatched to the recipient's device(s). Errors from the push provider are silently caught and
never propagate to the caller — the DB insert is always authoritative.

This follows the same pattern as `paymentWebhookVerifier` (optional, not set by factory, must be
injected by production handler or tests). The actual APNs/FCM/Expo adapter is outside scope;
MOBILE-PUSH-001 wires the mobile client side.

## Contract

```ts
// In push-token.ts (alongside PushTokenRepository)
type PushNotificationProvider = {
  sendPushNotification: (params: {
    userId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
  }) => Promise<void>;
};

// createSupabaseNotificationRepositories accepts:
type CreateSupabaseNotificationRepositoriesInput = {
  client: SupabaseClientLike;
  notificationPreferencesRepository?: NotificationPreferencesRepository;
  pushNotificationProvider?: PushNotificationProvider;  // ← new
};
```

Dispatch is fire-and-forget after each successful DB insert:
```ts
// After DB insert:
pushNotificationProvider
  ?.sendPushNotification({ userId, type, payload })
  .catch(() => { /* intentional no-op */ });
```

`pushNotificationProvider` is intentionally NOT set by `createWorkerSupabaseDependencies` —
it is push-provider-SDK-specific and must be injected by the production fetch handler or tests.

## Affected files

- `docs/work-items/PUSH-DISPATCH-001-push-dispatch.md` (this file)
- `apps/workers/src/push-token.ts` — add `PushNotificationProvider` interface
- `apps/workers/src/notification-supabase.ts` — wire optional `pushNotificationProvider`
- `apps/workers/src/dependencies.ts` — add `pushNotificationProvider?` to `WorkerRequestDependencies`
  and `CreateWorkerSupabaseDependenciesInput`; wire in both factory + resolve functions
- `tests/workers/push-dispatch.test.ts` (new)

## Acceptance criteria

- [x] `PushNotificationProvider` interface added to `push-token.ts`
- [x] `sendPushNotification` called after `notifyAdoptionStatusChanged` insert with correct userId/type/payload
- [x] `sendPushNotification` called after `notifySponsorshipStatusChanged` insert
- [x] `sendPushNotification` called after `notifyDonationPaid` insert (with resolved donorUserId)
- [x] `sendPushNotification` called for each opted-in member after `notifyNewAdoptionApplication`
- [x] Push errors are silently caught — DB insert result not affected
- [x] When `pushNotificationProvider` is omitted, DB insert still works (backwards-compatible)
- [x] When notification is preference-gated (skipped), push is also NOT dispatched
- [x] `npm run typecheck`, `lint`, `test`, `build` all pass
