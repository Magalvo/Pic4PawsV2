# Work-Spec: Implementation Plan for NOTIFICATION-CLIENT-001

## 1. Target Files

### New
- `docs/work-items/NOTIFICATION-CLIENT-001-notification-client.md`
- `docs/work-specs/NOTIFICATION-CLIENT-001-notification-client.md`
- `tests/client/notification-client.test.ts`

### Modified
- `packages/client/src/index.ts` — append notification types and `createNotificationClient`

## 2. Design

### Types

```ts
export type NotificationClientType =
  | 'adoption_status_changed'
  | 'new_adoption_application'
  | 'donation_paid'
  | 'sponsorship_status_changed';

export type NotificationSummary = {
  notificationId: string;
  type: NotificationClientType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsClientSuccess = {
  ok: true;
  status: 'ok';
  notifications: NotificationSummary[];
  total: number;
  unreadCount: number;
};

export type ListNotificationsClientFailureStatus =
  | 'unauthenticated'
  | 'notification_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ListNotificationsClientFailure = {
  ok: false;
  status: ListNotificationsClientFailureStatus;
};

export type ListNotificationsClientResult =
  | ListNotificationsClientSuccess
  | ListNotificationsClientFailure;

export type MarkNotificationReadClientSuccess = {
  ok: true;
  status: 'notification_marked_read';
  notificationId: string;
};

export type MarkNotificationReadClientFailureStatus =
  | 'unauthenticated'
  | 'notification_not_found'
  | 'notification_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type MarkNotificationReadClientFailure = {
  ok: false;
  status: MarkNotificationReadClientFailureStatus;
};

export type MarkNotificationReadClientResult =
  | MarkNotificationReadClientSuccess
  | MarkNotificationReadClientFailure;

export type ListNotificationsClientQuery = {
  limit?: number;
  offset?: number;
};

export type CreateNotificationClientInput = {
  workerBaseUrl: string;
  notificationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

export type NotificationClient = {
  listNotifications: (query?: ListNotificationsClientQuery) => Promise<ListNotificationsClientResult>;
  markNotificationRead: (notificationId: string) => Promise<MarkNotificationReadClientResult>;
};
```

### `createNotificationClient` flows

**`listNotifications`**:
1. `getAccessToken()` → null → `{ ok: false, status: 'unauthenticated' }`
2. Build URL: `{workerBaseUrl}{notificationsPath}?limit={limit}&offset={offset}`
3. `fetch(url, { method: 'GET', Authorization: Bearer token })`
   catch → `{ ok: false, status: 'worker_request_failed' }`
4. Parse JSON body
5. `!response.ok` → map status to `ListNotificationsClientFailureStatus`
6. Validate body shape: `Array.isArray(body.notifications) && typeof body.total === 'number'`
   → invalid → `{ ok: false, status: 'worker_response_invalid' }`
7. Return success

**`markNotificationRead`**:
1. `getAccessToken()` → null → `{ ok: false, status: 'unauthenticated' }`
2. URL: `{workerBaseUrl}{notificationsPath}/{notificationId}/read`
3. `fetch(url, { method: 'PATCH', Authorization: Bearer token })`
   catch → `{ ok: false, status: 'worker_request_failed' }`
4. Parse JSON body
5. `response.status === 404` → `{ ok: false, status: 'notification_not_found' }`
6. `!response.ok` → map to failure status
7. Validate: `body.status === 'notification_marked_read'` → else `worker_response_invalid`
8. Return `{ ok: true, status: 'notification_marked_read', notificationId }`

## 3. Testing Strategy

### `tests/client/notification-client.test.ts` — 10 tests

| # | Method | Scenario | Expected |
|---|---|---|---|
| 1 | list | 200 with notifications | `{ ok: true, status: 'ok', notifications, total, unreadCount }` |
| 2 | list | limit/offset sent as query params | URL contains `limit=10&offset=0` |
| 3 | list | missing access token | `{ ok: false, status: 'unauthenticated' }` |
| 4 | list | 401 response | `{ ok: false, status: 'unauthenticated' }` |
| 5 | list | network error | `{ ok: false, status: 'worker_request_failed' }` |
| 6 | list | malformed 200 | `{ ok: false, status: 'worker_response_invalid' }` |
| 7 | markRead | 200 success | `{ ok: true, status: 'notification_marked_read', notificationId }` |
| 8 | markRead | 404 → not found | `{ ok: false, status: 'notification_not_found' }` |
| 9 | markRead | missing access token | `{ ok: false, status: 'unauthenticated' }` |
| 10 | markRead | network error | `{ ok: false, status: 'worker_request_failed' }` |

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
