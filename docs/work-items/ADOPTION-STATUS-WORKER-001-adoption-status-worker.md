# Work-Item: ADOPTION-STATUS-WORKER-001 — Adoption Status Worker Route

## 1. Context & Problem

`ADOPTION-LIST-WORKER-001` (merged) lets shelter staff see incoming adoption applications.
There is no route to act on them — shelter admins cannot approve, reject, or move an
application through its lifecycle. This is the last missing action in the adoption flow.

## 2. Acceptance Criteria

- [x] Create `apps/workers/src/adoption-status.ts`:
  - `AdoptionStatusRepository` interface: `getAdoptionForStatus` + `updateAdoptionStatus`.
  - `matchWorkerAdoptionStatusId` — mirrors `matchWorkerSponsorshipManageId` / `matchWorkerDonationStatusId`.
  - `validateAdoptionStatusPayload` — accepts `under_review | more_info_requested | approved | rejected`.
  - `handleWorkerAdoptionStatusRequest` — `PATCH /adoptions/:adoptionId`.
  - Access: shelter membership only (`canManageShelter`). The applicant cannot update status.
  - Response: `{ status: 'ok', applicationId, newStatus }`.
- [x] Create `apps/workers/src/adoption-status-supabase.ts`:
  - `createSupabaseAdoptionStatusRepositories({ client })`.
  - Queries `adoption_applications` table.
- [x] Modify `apps/workers/src/dependencies.ts`:
  - Add `adoptionStatusRepository?`.
  - Wire factory.
- [x] Modify `apps/workers/src/index.ts`:
  - Add `matchWorkerAdoptionStatusId` check BEFORE the exact `adoptionsPath` POST block.
  - Barrel-export all new types and functions.
- [x] Tests: `tests/workers/adoption-status.test.ts` (≥ 12 tests, fail → pass).
- [x] Update `docs/agent-resume.md`, `docs/work-tracks/remake-foundation.md`, checkpoint.
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Shelter-Manageable Statuses

```
SHELTER_MANAGE_STATUSES = ['under_review', 'more_info_requested', 'approved', 'rejected']
```

`draft`, `withdrawn`, `expired`, and `submitted` are not settable by the shelter via this route.
(The applicant submits → `submitted`. The shelter then moves forward from there.)

## 4. Route Ordering

```
// 1. PATCH /adoptions/:id  (NEW — adoption status)
// 2. POST  /adoptions       (existing — create application)
```

## 5. Completion Notes

Implemented in PR #76 on branch `agent/ADOPTION-STATUS-WORKER-001`.
- 29 tests (6 path-matcher + 10 payload-validation + 13 handler integration)
- 757 tests passing total
- TypeScript, lint, and build all clean
