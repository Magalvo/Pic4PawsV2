# Work-Spec: Implementation Plan for NOTIFICATION-WORKER-001

## 1. Target Files

### New
- `docs/work-items/NOTIFICATION-WORKER-001-notification-worker-routes.md`
- `docs/work-specs/NOTIFICATION-WORKER-001-notification-worker-routes.md`
- `apps/workers/src/notification.ts`
- `apps/workers/src/notification-supabase.ts`
- `tests/workers/notification.test.ts`

### Modified
- `packages/database/src/migration-artifacts.ts` — add `0002_notifications` migration
- `packages/config/src/env.ts` — add `WORKER_NOTIFICATIONS_PATH`, `notificationsPath`
- `apps/workers/src/dependencies.ts` — add `NotificationRepository` to `WorkerRequestDependencies` + wiring
- `apps/workers/src/index.ts` — add notification exports + routes
- `apps/workers/src/adoption-status.ts` — add `applicantUserId` to `AdoptionStatusRecord`, dispatch `notifyAdoptionStatusChanged`
- `apps/workers/src/adoption.ts` — dispatch `notifyNewAdoptionApplication` after `createApplication`
- `apps/workers/src/payment-webhook.ts` — dispatch `notifyDonationPaid` after `updateDonationStatus`
- `apps/workers/src/sponsorship-manage.ts` — dispatch `notifySponsorshipStatusChanged` after `updateSponsorshipStatus`

## 2. Design

### Migration SQL (in `migration-artifacts.ts`)

```sql
create type public.notification_type as enum (
  'adoption_status_changed',
  'new_adoption_application',
  'donation_paid',
  'sponsorship_status_changed'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type public.notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users_read_own_notifications"
  on public.notifications for select
  using (user_id = auth.uid());
```

### Types in `notification.ts`

```ts
export type NotificationType =
  | 'adoption_status_changed'
  | 'new_adoption_application'
  | 'donation_paid'
  | 'sponsorship_status_changed';

export type NotificationRecord = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsQuery = {
  limit: number;
  offset: number;
};

export type ListNotificationsResult = {
  notifications: NotificationRecord[];
  total: number;
  unreadCount: number;
};

export type NotificationRepository = {
  listNotifications: (userId: string, query: ListNotificationsQuery) => Promise<ListNotificationsResult>;
  markNotificationRead: (notificationId: string, userId: string) => Promise<boolean>;
  notifyAdoptionStatusChanged: (input: { applicantUserId: string; applicationId: string; newStatus: string }) => Promise<void>;
  notifyNewAdoptionApplication: (input: { shelterId: string; applicationId: string; petId: string; applicantName: string }) => Promise<void>;
  notifyDonationPaid: (input: { providerPaymentId: string; provider: string }) => Promise<void>;
  notifySponsorshipStatusChanged: (input: { donorUserId: string; sponsorshipId: string; newStatus: string }) => Promise<void>;
};
```

### Path matchers

```ts
// true if pathname === notificationsPath exactly
export const matchWorkerNotificationsPath = (
  pathname: string,
  notificationsPath: string,
): boolean => pathname === notificationsPath;

// extracts notificationId from /{notificationsPath}/{id}/read
// returns null for any other shape
export const matchWorkerNotificationReadId = (
  pathname: string,
  notificationsPath: string,
): string | null => {
  const prefix = notificationsPath.endsWith('/') ? notificationsPath : `${notificationsPath}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');
  if (parts.length !== 2 || parts[1] !== 'read' || !parts[0]) return null;
  return parts[0];
};
```

### Handler input types

```ts
export type HandleWorkerNotificationListRequestInput = {
  request: Request;
  notificationRepository?: NotificationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export type HandleWorkerNotificationReadRequestInput = {
  request: Request;
  notificationId: string;
  notificationRepository?: NotificationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};
```

### Handler flows

**GET /notifications** (`handleWorkerNotificationListRequest`):
1. Method check (GET only → 405)
2. Extract bearer token → 401
3. Authenticator check → 501
4. Authenticate → 401
5. Repository check → 501
6. Parse `limit` (default 20, max 100) and `offset` (default 0) from query params
7. `listNotifications(actor.id, { limit, offset })`
8. Return `{ status: 'ok', notifications, total, unreadCount }` → 200

**PATCH /notifications/:id/read** (`handleWorkerNotificationReadRequest`):
1. Method check (PATCH only → 405)
2. Extract bearer token → 401
3. Authenticator check → 501
4. Authenticate → 401
5. Repository check → 501
6. `markNotificationRead(notificationId, actor.id)` → false → 404
7. Return `{ status: 'notification_marked_read', notificationId }` → 200

### Dispatch pattern (fire-and-forget)

```ts
// In adoption-status.ts after step 9 (updateAdoptionStatus):
if (notificationRepository) {
  notificationRepository
    .notifyAdoptionStatusChanged({
      applicantUserId: adoption.applicantUserId,
      applicationId,
      newStatus: validation.data.status,
    })
    .catch(() => undefined);
}
```

### Supabase implementation (`notification-supabase.ts`)

`notifyNewAdoptionApplication`:
- Query `shelter_memberships WHERE shelter_id = shelterId AND deleted_at IS NULL`
- Insert one `notifications` row per member userId

`notifyDonationPaid`:
- Query `donation_transactions WHERE provider_payment_id = providerPaymentId AND provider = provider`
- Insert notification for `donorUserId` found

`notifyAdoptionStatusChanged` / `notifySponsorshipStatusChanged`:
- Single `INSERT INTO notifications` with the relevant payload

`listNotifications`:
- Query `notifications WHERE user_id = userId ORDER BY created_at DESC LIMIT limit OFFSET offset`
- Count total + unread (where `read_at IS NULL`)

`markNotificationRead`:
- `UPDATE notifications SET read_at = now() WHERE id = notificationId AND user_id = userId`
- Return `true` if a row was updated, `false` otherwise

## 3. Config changes

In `packages/config/src/env.ts`:
- Add `WORKER_NOTIFICATIONS_PATH: z.string().startsWith('/').default('/notifications')` to schema
- Add `notificationsPath: string` to `EnvironmentConfig.workers`
- Map `notificationsPath: env.WORKER_NOTIFICATIONS_PATH` in the return value

## 4. AdoptionStatusRecord change

Add `applicantUserId: string` to `AdoptionStatusRecord` in `adoption-status.ts`.
The Supabase implementation in `adoption-status-supabase.ts` must SELECT `applicant_user_id` and return it.

## 5. Testing Strategy

### `tests/workers/notification.test.ts` — 15 tests

| # | Handler | Scenario | Expected |
|---|---|---|---|
| 1 | list | 200 success | `{ status: 'ok', notifications, total, unreadCount }` |
| 2 | list | no bearer token | 401 |
| 3 | list | no authenticator | 501 |
| 4 | list | bad token | 401 |
| 5 | list | no repository | 501 |
| 6 | read | 200 success | `{ status: 'notification_marked_read', notificationId }` |
| 7 | read | notification not found | 404 |
| 8 | read | no bearer token | 401 |
| 9 | read | no repository | 501 |
| 10 | dispatch | adoptionStatus handler calls notifyAdoptionStatusChanged | mock called once |
| 11 | dispatch | adoption handler calls notifyNewAdoptionApplication | mock called once |
| 12 | dispatch | paymentWebhook handler calls notifyDonationPaid | mock called once |
| 13 | dispatch | sponsorshipManage handler calls notifySponsorshipStatusChanged | mock called once |
| 14 | matcher | matchWorkerNotificationsPath exact | true / false |
| 15 | matcher | matchWorkerNotificationReadId extracts id | 'abc' / null |

## 6. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
