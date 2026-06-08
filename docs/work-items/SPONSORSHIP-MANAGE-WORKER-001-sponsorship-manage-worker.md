# Work-Item: SPONSORSHIP-MANAGE-WORKER-001 — Sponsorship Manage Worker Route

## 1. Context & Problem

`SPONSORSHIP-LIST-WORKER-001` (merged, PR #64) allows shelter admins to list recurring sponsorships.
There is no way to cancel, pause, or resume a sponsorship. Shelter admins need to be able to
change the status of any sponsorship for their shelter, and donors need to be able to cancel
their own sponsorships.

## 2. Acceptance Criteria

- [ ] Create `apps/workers/src/sponsorship-manage.ts`:
  - `matchWorkerSponsorshipManageId(pathname, sponsorshipsPath)` — extracts `sponsorshipId`
    from `{sponsorshipsPath}/{sponsorshipId}` (single segment, mirrors donation-status pattern).
  - `validateSponsorshipManagePayload(payload)` — validates `{ status: SponsorshipStatus }`.
  - `GetSponsorshipForManageResult = { sponsorshipId; shelterId; donorUserId; currentStatus }`.
  - `UpdateSponsorshipStatusInput = { sponsorshipId; status: SponsorshipStatus }`.
  - `SponsorshipManageRepository = { getSponsorshipForManage; updateSponsorshipStatus }`.
  - `handleWorkerSponsorshipManageRequest({ request, sponsorshipId, payload, sponsorshipManageRepository?, authenticator? })`.
    Handler flow:
    1. Method check: PATCH only → 405.
    2. Bearer token → 401.
    3. Authenticator configured → 501.
    4. Authenticate → 401.
    5. Repository configured → 501 `sponsorship_manage_repository_not_configured`.
    6. Validate payload → 400 `{ status: 'invalid_sponsorship_manage', reasons }`.
    7. Look up sponsorship → 404 `sponsorship_not_found`.
    8. Access control: `canManageShelter(actor, shelterId) || actor.id === donorUserId` → 403.
    9. Update status.
    10. Return 200 `{ status: 'ok', sponsorshipId, status: newStatus }`.
- [ ] Create `apps/workers/src/sponsorship-manage-supabase.ts`:
  - `createSupabaseSponsorshipManageRepositories({ client })` — Supabase impl.
  - `getSponsorshipForManage`: `.select('id,shelter_id,donor_user_id,status').eq('id', sponsorshipId).single()`.
  - `updateSponsorshipStatus`: `.update({ status }).eq('id', sponsorshipId)`.
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `sponsorshipManageRepository?: SponsorshipManageRepository` to `WorkerRequestDependencies`.
  - Wire `createSupabaseSponsorshipManageRepositories` in `createWorkerSupabaseDependencies`.
  - Add to `resolveWorkerRequestDependencies` merge.
- [ ] Modify `apps/workers/src/index.ts`:
  - Import `handleWorkerSponsorshipManageRequest`, `matchWorkerSponsorshipManageId`.
  - Add route block for `matchWorkerSponsorshipManageId` BEFORE the exact `sponsorshipsPath` block.
  - Add barrel exports for all new types and functions.
- [ ] Tests: `tests/workers/sponsorship-manage.test.ts` (≥ 13 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No client changes in this work item (client will be SPONSORSHIP-MANAGE-CLIENT-001).
- No Web/Mobile UI changes.

## 4. Completion Notes

_To be filled in after implementation._
