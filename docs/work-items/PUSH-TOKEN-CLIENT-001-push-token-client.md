---
id: PUSH-TOKEN-CLIENT-001
status: done
---

# PUSH-TOKEN-CLIENT-001 — Push Token Client

## Goal

Add `createPushTokenClient` to `@pic4paws/client` with `registerToken` and `unregisterToken`
methods that call the `POST /notifications/push-token` and `DELETE /notifications/push-token`
Worker routes introduced in PUSH-TOKEN-WORKER-001.

## States

| Operation | Status returned |
|---|---|
| `registerToken` — success | `{ ok: true, status: 'push_token_registered' }` |
| `registerToken` — invalid payload | `{ ok: false, status: 'invalid_payload', reasons }` |
| `registerToken` — unauthenticated | `{ ok: false, status: 'unauthenticated', reasons }` |
| `unregisterToken` — success | `{ ok: true, status: 'push_token_removed' }` |
| `unregisterToken` — not found | `{ ok: false, status: 'push_token_not_found', reasons }` |
| Any — missing access token | `{ ok: false, status: 'unauthenticated', reasons }` |
| Any — network error | `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }` |
| Any — malformed response | `{ ok: false, status: 'worker_response_invalid', reasons }` |

## Contract

```ts
type PushTokenClientPlatform = 'ios' | 'android' | 'expo';

type RegisterPushTokenClientSuccess = {
  ok: true;
  status: 'push_token_registered';
};

type RegisterPushTokenClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_payload'
  | 'push_token_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

type RegisterPushTokenClientResult = RegisterPushTokenClientSuccess | RegisterPushTokenClientFailure;

type UnregisterPushTokenClientSuccess = {
  ok: true;
  status: 'push_token_removed';
};

type UnregisterPushTokenClientFailureStatus =
  | 'unauthenticated'
  | 'push_token_not_found'
  | 'push_token_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

type UnregisterPushTokenClientResult = UnregisterPushTokenClientSuccess | UnregisterPushTokenClientFailure;

type PushTokenClient = {
  registerToken: (token: string, platform: PushTokenClientPlatform) => Promise<RegisterPushTokenClientResult>;
  unregisterToken: (token: string) => Promise<UnregisterPushTokenClientResult>;
};

type CreatePushTokenClientInput = {
  workerBaseUrl: string;
  notificationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

// createPushTokenClient(input): PushTokenClient
```

## Affected files

- `docs/work-items/PUSH-TOKEN-CLIENT-001-push-token-client.md` (this file)
- `packages/client/src/notifications.ts` — add push-token types + `createPushTokenClient` factory
- `tests/client/push-token-client.test.ts` (new)

## Acceptance criteria

- [x] `registerToken` sends POST to `{notificationsPath}/push-token` with `{ token, platform }` body and Bearer header
- [x] `registerToken` returns `{ ok: true, status: 'push_token_registered' }` on 200
- [x] `registerToken` returns `{ ok: false, status: 'invalid_payload' }` on 400
- [x] `unregisterToken` sends DELETE to `{notificationsPath}/push-token` with `{ token }` body and Bearer header
- [x] `unregisterToken` returns `{ ok: true, status: 'push_token_removed' }` on 200
- [x] `unregisterToken` returns `{ ok: false, status: 'push_token_not_found' }` on 404
- [x] Both methods return `{ ok: false, status: 'unauthenticated' }` when access token is null/empty
- [x] Both methods return `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }` on fetch throw
- [x] `sanitizeReasons` strips credential markers from all failure responses
- [x] `npm run typecheck`, `lint`, `test`, `build` all pass
