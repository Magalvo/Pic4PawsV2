# Work-Item: SPONSORSHIP-DONOR-LIST-WORKER-001 — Donor-Facing Sponsorship List Worker Route

## 1. Context & Problem

`SPONSORSHIP-MANAGE-WORKER-001` (merged, PR #68) lets donors cancel/pause/resume a sponsorship.
To act on a sponsorship the donor must first retrieve it. Currently there is no route returning
a donor's own sponsorships. The shelter-side list (`GET /shelters/:shelterId/sponsorships`)
requires shelter membership — it is not accessible to donors.

## 2. Acceptance Criteria

- [ ] Create `apps/workers/src/sponsorship-donor-list.ts`:
  - `SponsorshipDonorListRepository` interface: `listDonorSponsorships(query)`.
  - `HandleWorkerSponsorshipDonorListRequestInput` type.
  - `handleWorkerSponsorshipDonorListRequest` handler — `GET /sponsorships`.
  - Access: authenticated actor only, returns their own sponsorships (`donorUserId = actor.id`).
  - Pagination: `limit` (default 20, max 100) and `offset` (default 0) query params.
  - Response: `{ status: 'ok', sponsorships: SponsorshipListSummary[], total: number }`.
  - Reuses `SponsorshipListSummary` from `./sponsorship-list`.
- [ ] Create `apps/workers/src/sponsorship-donor-list-supabase.ts`:
  - `createSupabaseSponsorshipDonorListRepositories({ client })` — Supabase implementation.
  - Queries `sponsorships` table filtered by `donor_user_id`.
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `sponsorshipDonorListRepository?: SponsorshipDonorListRepository`.
  - Wire `createSupabaseSponsorshipDonorListRepositories` in factory.
- [ ] Modify `apps/workers/src/index.ts`:
  - Before the exact `sponsorshipsPath` POST block, add a `GET` branch that calls
    `handleWorkerSponsorshipDonorListRequest`.
  - Barrel-export all new types and functions.
- [ ] Tests: `tests/workers/sponsorship-donor-list.test.ts` (≥ 10 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Route Ordering in `index.ts`

The `sponsorshipsPath` (default `/sponsorships`) currently handles POST (create) and PATCH
sub-path (manage via `matchWorkerSponsorshipManageId`). The GET branch must be inserted before
the existing POST block so non-GET methods continue reaching `handleWorkerSponsorshipRequest`:

```
// 1. PATCH /sponsorships/:id  (already exists — manage)
// 2. GET  /sponsorships        (NEW — donor list)
// 3. POST /sponsorships        (existing — create)
```

## 4. Error Statuses

| Status                                         | HTTP |
|------------------------------------------------|------|
| `unauthenticated`                              | 401  |
| `auth_adapter_not_configured`                  | 501  |
| `sponsorship_donor_list_repository_not_configured` | 501 |
| `method_not_allowed` (fallthrough to POST handler) | 405 |

## 5. Non-Goals

- No changes to shelter-side list or manage routes.
- No filtering by status (return all statuses).

## 6. Completion Notes

_To be filled in after implementation._
