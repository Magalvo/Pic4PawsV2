# Work-Item: NOTIFICATION-WORKER-001 — Notification Worker Routes

## 1. Context & Problem

Pic4Paws needs an in-app notification system so users can be alerted about key events
(adoption status changes, new applications, payments, sponsorship updates) without
leaving the app.

This worker item covers the full server-side foundation:
- A `notifications` database table and migration
- A `NotificationRepository` interface + Supabase implementation
- Fire-and-forget dispatch wired into 4 existing handlers as optional side effects
- Two new authenticated routes: `GET /notifications` (list) and `PATCH /notifications/:id/read`

## 2. Acceptance Criteria

- [ ] Migration `0002_notifications` adds `notification_type` enum and `notifications` table to Supabase.
- [ ] `NotificationType` union type defined with 4 values.
- [ ] `NotificationRecord` type defined with `notificationId`, `userId`, `type`, `payload`, `readAt`, `createdAt`.
- [ ] `NotificationRepository` interface defined with 6 methods: `listNotifications`, `markNotificationRead`, and 4 `notify*` dispatch methods.
- [ ] Supabase implementation (`createSupabaseNotificationRepositories`) wired via dependency factory.
- [ ] `notificationRepository?` added to `WorkerRequestDependencies`.
- [ ] `WORKER_NOTIFICATIONS_PATH` env key added (default `/notifications`) to config.
- [ ] `config.workers.notificationsPath` plumbed through `EnvironmentConfig`.
- [ ] `matchWorkerNotificationsPath(pathname, notificationsPath)` → `boolean`.
- [ ] `matchWorkerNotificationReadId(pathname, notificationsPath)` → `string | null` (extracts id from `/{path}/{id}/read`).
- [ ] `GET /notifications` returns `{ notifications, total, unreadCount }` for authenticated actor; 401/501 without auth.
- [ ] `PATCH /notifications/:id/read` marks a notification read; returns 200 or 404 if not found.
- [ ] `adoptionStatusRepository.getAdoptionForStatus` updated to also return `applicantUserId`; `AdoptionStatusRecord` gains `applicantUserId: string`.
- [ ] After `updateAdoptionStatus`, dispatch `notifyAdoptionStatusChanged` fire-and-forget.
- [ ] After `createApplication` in adoption handler, dispatch `notifyNewAdoptionApplication` fire-and-forget.
- [ ] After `updateDonationStatus` in payment-webhook handler, dispatch `notifyDonationPaid` fire-and-forget.
- [ ] After `updateSponsorshipStatus` in sponsorship-manage handler, dispatch `notifySponsorshipStatusChanged` fire-and-forget.
- [ ] Dispatch failures are silently swallowed — never affect the primary response.
- [ ] Supabase `notifyNewAdoptionApplication` implementation queries all active shelter memberships and inserts one notification row per member.
- [ ] Supabase `notifyDonationPaid` implementation queries `donation_transactions` by `providerPaymentId` + `provider` to resolve `donorUserId`.
- [ ] All new routes and exports added to `apps/workers/src/index.ts`.
- [ ] 15 tests covering: list notifications (success, unauthenticated, 501), mark read (success, not-found, unauthenticated), 4 dispatch side-effects, path matchers.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No push notifications (Expo or otherwise) in this item.
- No pagination UI — just offset/limit query params on the API.
- No notification preferences or opt-out.
- Do not implement client or UI boundaries (separate work items).

## 4. Completion Notes

Implemented in commit `8d1c2ed` on branch `agent/notifications-batch`.

- `packages/database/src/migration-artifacts.ts` — added `notificationsMigration` (`0002_notifications`) with `notification_type` enum, `notifications` table, index, RLS, and policy; updated `migrationArtifacts` array.
- `packages/config/src/env.ts` — added `WORKER_NOTIFICATIONS_PATH` env key (default `/notifications`), `notificationsPath` field on `EnvironmentConfig.workers`.
- `apps/workers/src/notification.ts` — `NotificationType`, `NotificationRecord`, `NotificationRepository`, path matchers, and both request handlers.
- `apps/workers/src/notification-supabase.ts` — full Supabase implementation including member-fanout for new applications and donor-lookup-by-payment-id for donation paid.
- `apps/workers/src/adoption-status.ts` — added `applicantUserId` to record type and fire-and-forget `notifyAdoptionStatusChanged` dispatch.
- `apps/workers/src/adoption-status-supabase.ts` — updated select query and row mapping to include `applicant_user_id`.
- `apps/workers/src/adoption.ts` — added fire-and-forget `notifyNewAdoptionApplication` dispatch after `createApplication`.
- `apps/workers/src/payment-webhook.ts` — added fire-and-forget `notifyDonationPaid` dispatch when `newStatus === 'paid'`.
- `apps/workers/src/sponsorship-manage.ts` — added fire-and-forget `notifySponsorshipStatusChanged` dispatch.
- `apps/workers/src/dependencies.ts` — wired `createSupabaseNotificationRepositories` into dependency factory; added `notificationRepository` to `WorkerRequestDependencies`.
- `apps/workers/src/index.ts` — wired `notificationRepository` into all 4 handler calls; added list and read routes.
- `tests/workers/notification.test.ts` — 21 tests (path matchers, list, mark-read, 4 dispatch side-effects).
- `tests/config/environment-contracts.test.ts` — added `notificationsPath` to workers contract expectation.
- `tests/database/migration-artifacts.test.ts` — updated `migrationArtifacts` expectation.

Key decisions: `notifyDonationPaid` takes `{ providerPaymentId, provider }` and resolves the donor user ID inside the Supabase implementation, because the payment webhook handler only returns `{ found: boolean }`. `{ count: 'exact' }` used for both total and unread count; `head: true` is not in the project's `SupabaseTableQueryLike` type.
