# Work-Spec: Implementation Plan for MOBILE-NOTIFICATION-001

## 1. Target Files

### New
- `docs/work-items/MOBILE-NOTIFICATION-001-mobile-notification-product-boundary.md`
- `docs/work-specs/MOBILE-NOTIFICATION-001-mobile-notification-product-boundary.md`
- `apps/mobile/src/notification.ts`
- `tests/mobile/notification.test.ts`

### Modified
- `apps/mobile/src/foundation.ts` — add `notification` to `MobileFoundationContent` and `mobileFoundationContent`

## 2. Design

### State types (mirrors Web with `Mobile` prefix)

```ts
export type MobileNotificationIdleState = { status: 'idle' };
export type MobileNotificationLoadingState = { status: 'loading' };
export type MobileNotificationLoadedState = {
  status: 'loaded';
  notifications: NotificationSummary[];
  total: number;
  unreadCount: number;
};
export type MobileNotificationFailedState = { status: 'failed'; message: string };

export type MobileNotificationState =
  | MobileNotificationIdleState
  | MobileNotificationLoadingState
  | MobileNotificationLoadedState
  | MobileNotificationFailedState;
```

### UI content

```ts
export type MobileNotificationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  loadingMessage: string;
  emptyMessage: string;
  failedMessage: string;
  markReadLabel: string;
};

export const mobileNotificationUiContent: MobileNotificationUiContent = {
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

### Factory (mirrors Web)

```ts
export type CreateMobileNotificationUiInput = {
  notificationClient: NotificationClient;
};

export type MobileNotificationUi = {
  getInitialState: () => MobileNotificationIdleState;
  loadNotifications: () => Promise<MobileNotificationState>;
  markRead: (state: MobileNotificationLoadedState, notificationId: string) => Promise<MobileNotificationLoadedState>;
};

export const createMobileNotificationUi = ({
  notificationClient,
}: CreateMobileNotificationUiInput): MobileNotificationUi => ({ ... });
```

### Foundation registration

```ts
// MobileFoundationContent
notification: Pick<MobileNotificationUiContent, 'title' | 'description' | 'status'>;

// mobileFoundationContent
notification: {
  title: mobileNotificationUiContent.title,
  description: mobileNotificationUiContent.description,
  status: mobileNotificationUiContent.status,
},
```

## 3. Testing Strategy

### `tests/mobile/notification.test.ts` — 8 tests

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `{ status: 'idle' }` |
| 2 | `loadNotifications()` success | `{ status: 'loaded', notifications: [...], total, unreadCount }` |
| 3 | `loadNotifications()` failure | `{ status: 'failed', message: failedMessage }` |
| 4 | `markRead` updates readAt optimistically | matching notification has `readAt` set |
| 5 | `markRead` decrements unreadCount for unread notification | `unreadCount` reduced by 1 |
| 6 | `markRead` does not change unreadCount for already-read notification | unchanged |
| 7 | `mobileNotificationUiContent` locale is `'pt-PT'` | literal check |
| 8 | `mobileNotificationUiContent` status is `'product-flow-ready'` | literal check |

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
