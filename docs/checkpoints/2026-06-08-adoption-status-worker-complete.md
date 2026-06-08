# Checkpoint: Adoption Status Worker Complete — 2026-06-08

## PRs Merged

| PR  | Work Item                    | Description                                                              |
| --- | ---------------------------- | ------------------------------------------------------------------------ |
| #76 | ADOPTION-STATUS-WORKER-001   | `PATCH /adoptions/:applicationId` shelter-only status management Worker route |

## What Was Built

### Worker (`ADOPTION-STATUS-WORKER-001`)
- `PATCH /adoptions/:applicationId` authenticated route
- Shelter membership only — `canManageShelter(actor, shelterId)` — no dual access
- `AdoptionStatusRepository` interface: `getAdoptionForStatus` + `updateAdoptionStatus`
- `matchWorkerAdoptionStatusId(pathname, adoptionsPath)` path matcher (mirrors `matchWorkerSponsorshipManageId`)
- Route registered BEFORE exact `adoptionsPath` POST block to avoid conflicts
- Shelter-settable statuses: `under_review | more_info_requested | approved | rejected`
  - `draft`, `submitted`, `withdrawn`, `expired` explicitly rejected
- Supabase repository implementation in `adoption-status-supabase.ts`
  - Table: `adoption_applications`, columns: `id`, `shelter_id`, `status`
- Response: `{ status: 'ok', applicationId, newStatus }`
- Barrel exports added to `apps/workers/src/index.ts`
- `adoptionStatusRepository` wired into `WorkerRequestDependencies` + `createWorkerSupabaseDependencies`
- 29 tests (6 path-matcher + 10 payload-validation + 13 handler integration)

## Validation

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 757 tests passing (103 files)
- `npm run build` ✅

## Foundation Status

| Slice                       | Worker | Client | Web | Mobile |
| --------------------------- | ------ | ------ | --- | ------ |
| Media upload                | ✅     | ✅     | ✅  | ✅     |
| Pet media upload+attach     | ✅     | ✅     | ✅  | ✅     |
| Pet publish                 | ✅     | ✅     | ✅  | ✅     |
| Pet draft                   | ✅     | ✅     | ✅  | ✅     |
| Pet draft save flow         | ✅     | ✅     | ✅  | ✅     |
| Pet feed (public)           | ✅     | ✅     | ✅  | ✅     |
| Pet profile (public)        | ✅     | ✅     | ✅  | ✅     |
| Shelter profile (public)    | ✅     | ✅     | ✅  | ✅     |
| Adoption application        | ✅     | ✅     | ✅  | ✅     |
| Adoption list               | ✅     | ✅     | ✅  | ✅     |
| Adoption status             | ✅     | —      | —   | —      |
| Donation                    | ✅     | ✅     | ✅  | ✅     |
| Donation list               | ✅     | ✅     | ✅  | ✅     |
| Payment webhook             | ✅     | —      | —   | —      |
| Donation status             | ✅     | ✅     | ✅  | ✅     |
| Sponsorship                 | ✅     | ✅     | ✅  | ✅     |
| Sponsorship list            | ✅     | ✅     | ✅  | ✅     |
| Sponsorship manage          | ✅     | ✅     | ✅  | ✅     |
| Sponsorship donor list      | ✅     | ✅     | ✅  | ✅     |

## Recommended Next

Continue the adoption status slice with client + Web/Mobile boundaries:
- `ADOPTION-STATUS-CLIENT-001` — `createAdoptionStatusClient` in `@pic4paws/client`
- `WEB-ADOPTION-STATUS-001` — Web adoption status product boundary
- `MOBILE-ADOPTION-STATUS-001` — Mobile adoption status product boundary

Or begin a new domain slice:
- Shelter member management (invite/remove shelter admins)
- Notifications (push notification boundaries)
- Pet status transitions (archive/re-publish)
