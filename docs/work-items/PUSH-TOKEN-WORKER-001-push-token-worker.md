---
id: PUSH-TOKEN-WORKER-001
status: done
---

# PUSH-TOKEN-WORKER-001 — Push Token Worker Route

## Goal

Add `POST /notifications/push-token` and `DELETE /notifications/push-token` Worker routes so authenticated mobile clients can register and unregister their device push tokens. Tokens are stored in a new `push_tokens` table (migration 0006) and will be consumed by PUSH-DISPATCH-001 to send APNs/FCM pushes alongside in-DB notification dispatch.

## States

| HTTP route | Status returned |
|---|---|
| `POST` — success | 200 `push_token_registered` |
| `POST` — token already registered | 200 `push_token_registered` (idempotent upsert) |
| `POST` — invalid payload | 400 `invalid_payload` |
| `DELETE` — success | 200 `push_token_removed` |
| `DELETE` — token not found | 404 `push_token_not_found` |
| Any method — unauthenticated | 401 `unauthenticated` |
| Any method — wrong HTTP method | 405 `method_not_allowed` |
| Any method — missing repo | 501 `push_token_repository_not_configured` |

## Contract

```ts
type PushTokenPlatform = 'ios' | 'android' | 'expo';

type PushTokenRepository = {
  upsertPushToken: (userId: string, token: string, platform: PushTokenPlatform) => Promise<void>;
  deletePushToken: (userId: string, token: string) => Promise<boolean>;
};

// matchWorkerPushTokenPath(pathname, notificationsPath): boolean
// pathname === `${notificationsPath}/push-token`

// POST /notifications/push-token
// body: { token: string, platform: PushTokenPlatform }

// DELETE /notifications/push-token
// body: { token: string }
```

Route ordering within notifications module (must remain stable):
1. `/notifications/{id}/read` — matchWorkerNotificationReadId
2. `/notifications/preferences` — matchWorkerNotificationPreferencesPath
3. `/notifications/push-token` — matchWorkerPushTokenPath ← this work item
4. `/notifications` exact — matchWorkerNotificationsPath

## Affected files

- `docs/work-items/PUSH-TOKEN-WORKER-001-push-token-worker.md` (this file)
- `packages/database/src/migration-artifacts.ts` — add pushTokensMigration (0006)
- `apps/workers/src/pet-supabase.ts` — extend SupabaseTableQueryLike with `delete()`
- `apps/workers/src/push-token.ts` (new)
- `apps/workers/src/push-token-supabase.ts` (new)
- `apps/workers/src/routes/notifications.ts` — add push-token route before exact match
- `apps/workers/src/dependencies.ts` — add pushTokenRepository
- `tests/workers/push-token.test.ts` (new)
- `tests/workers/push-token-supabase.test.ts` (new)
- `tests/workers/route-table.test.ts` — push-token ordering assertion

## Acceptance criteria

- [x] Migration 0006 creates `push_tokens` table with user_id FK, token, platform, unique(user_id, token), RLS enabled
- [x] `matchWorkerPushTokenPath` returns true only for exact `{notificationsPath}/push-token`
- [x] POST returns 200 `push_token_registered` on upsert success (idempotent)
- [x] POST returns 400 for missing/empty token or invalid platform
- [x] DELETE returns 200 `push_token_removed` on success
- [x] DELETE returns 404 `push_token_not_found` when token doesn't exist for user
- [x] Auth ladder: 405 → 501 (no authenticator) → 401 → 501 (no repo) → 400/200/404
- [x] Route ordering: push-token path does not match notifications exact-match guard
- [x] `npm run typecheck`, `lint`, `test`, `build` all pass
