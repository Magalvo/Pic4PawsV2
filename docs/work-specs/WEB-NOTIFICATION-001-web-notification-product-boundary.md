# Work-Spec: Implementation Plan for WEB-NOTIFICATION-001

## 1. Target Files

### New
- `docs/work-items/WEB-NOTIFICATION-001-web-notification-product-boundary.md`
- `docs/work-specs/WEB-NOTIFICATION-001-web-notification-product-boundary.md`
- `apps/web/src/notification.ts`
- `tests/web/notification.test.ts`

### Modified
- `apps/web/src/foundation.ts` — add `notification` to `WebFoundationContent` and `webFoundationContent`

## 2. Design

### State types

```ts
export type WebNotificationIdleState = {
  status: 'idle';
};

export type WebNotificationLoadingState = {
  status: 'loading';
};

export type WebNotificationLoadedState = {
  status: 'loaded';
  notifications: NotificationSummary[];
  total: number;
  unreadCount: number;
};

export type WebNotificationFailedState = {
  status: 'failed';
  message: string;
};

export type WebNotificationState =
  | WebNotificationIdleState
  | WebNotificationLoadingState
  | WebNotificationLoadedState
  | WebNotificationFailedState;
```

### UI content

```ts
export type WebNotificationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
  emptyMessage: string;
  failedMessage: string;
  markReadLabel: string;
};

export const webNotificationUiContent: WebNotificationUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Notificações',
  description: 'As suas notificações de atividade',
  loadingMessage: 'A carregar notificações…',
  emptyMessage: 'Sem notificações',
  failedMessage: 'Não foi possível carregar as notificações.',
  markReadLabel: 'Marcar como lida',
};
```

### Factory

```ts
export type CreateWebNotificationUiInput = {
  notificationClient: NotificationClient;
};

export type WebNotificationUi = {
  getInitialState: () => WebNotificationIdleState;
  loadNotifications: () => Promise<WebNotificationState>;
  markRead: (state: WebNotificationLoadedState, notificationId: string) => Promise<WebNotificationLoadedState>;
};

export const createWebNotificationUi = ({
  notificationClient,
}: CreateWebNotificationUiInput): WebNotificationUi => ({ ... });
```

### `loadNotifications` flow
1. (call returns `loading` state immediately — caller can use that)
2. `notificationClient.listNotifications({ limit: 20, offset: 0 })`
3. `!result.ok` → `{ status: 'failed', message: webNotificationUiContent.failedMessage }`
4. `{ status: 'loaded', notifications: result.notifications, total: result.total, unreadCount: result.unreadCount }`

### `markRead` flow
1. Optimistically set `readAt` on the matching notification in the list
2. Decrement `unreadCount` if it was previously unread
3. `notificationClient.markNotificationRead(notificationId)` fire-and-forget (result ignored)
4. Return updated `loaded` state

### Foundation registration

```ts
// WebFoundationContent
notification: Pick<WebNotificationUiContent, 'title' | 'description' | 'status'>;

// webFoundationContent
notification: {
  title: webNotificationUiContent.title,
  description: webNotificationUiContent.description,
  status: webNotificationUiContent.status,
},
```

## 3. Testing Strategy

### `tests/web/notification.test.ts` — 8 tests

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `{ status: 'idle' }` |
| 2 | `loadNotifications()` success | `{ status: 'loaded', notifications: [...], total, unreadCount }` |
| 3 | `loadNotifications()` failure | `{ status: 'failed', message: failedMessage }` |
| 4 | `markRead` updates readAt optimistically | matching notification has `readAt` set |
| 5 | `markRead` decrements unreadCount for unread notification | `unreadCount` reduced by 1 |
| 6 | `markRead` does not change unreadCount for already-read notification | unchanged |
| 7 | `webNotificationUiContent` locale is `'pt-PT'` | literal check |
| 8 | `webNotificationUiContent` status is `'product-flow-ready'` | literal check |

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
