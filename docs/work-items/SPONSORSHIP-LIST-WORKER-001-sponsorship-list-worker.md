# Work-Item: SPONSORSHIP-LIST-WORKER-001 — Sponsorship List Worker Route

## 1. Context & Problem

`SPONSORSHIP-WORKER-001` (merged, PR #60) exposes `POST /sponsorships` for creating
recurring sponsorships. Shelters have no authenticated route to list their sponsorships.

## 2. Acceptance Criteria

- [ ] Create `apps/workers/src/sponsorship-list.ts`:
  - `SponsorshipStatus = 'active' | 'cancelled' | 'paused'`
  - `SponsorshipListSummary` — `sponsorshipId, amountCents, currency, paymentMethod,
    recurringInterval, status, petId, createdAt`
  - `ListSponsorshipsQuery = { shelterId, limit?, offset? }`
  - `ListSponsorshipsResult = { sponsorships, total }`
  - `SponsorshipListRepository.listSponsorships`
  - `matchWorkerSponsorshipListShelterId(pathname, shelterPath)` path matcher:
    extracts shelterId from `{shelterPath}/{shelterId}/sponsorships`
  - `handleWorkerSponsorshipListRequest` — GET only, auth, shelter membership check
    (`canManageShelter`), pagination (limit/offset), `501` when repository not configured
- [ ] Create `apps/workers/src/sponsorship-list-supabase.ts`:
  - `createSupabaseSponsorshipListRepositories({ client })`
  - Queries `sponsorships` table — `eq('shelter_id')`, ordered by `created_at desc`,
    range pagination, `count: 'exact'`
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `sponsorshipListRepository?: SponsorshipListRepository` to `WorkerRequestDependencies`
  - Wire from `createSupabaseSponsorshipListRepositories` in `createWorkerSupabaseDependencies`
  - Merge in `resolveWorkerRequestDependencies`
- [ ] Modify `apps/workers/src/index.ts`:
  - Import `handleWorkerSponsorshipListRequest`, `matchWorkerSponsorshipListShelterId`
  - Add route block using `matchWorkerSponsorshipListShelterId(url.pathname, config.workers.shelterPath)`
    **before** the exact `sponsorshipsPath` POST route
  - Barrel-export all new types and functions
- [ ] Tests: `tests/workers/sponsorship-list.test.ts` (≥ 10 tests, fail → pass)
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## 3. Non-Goals

- No client or UI boundary in this item.
- No sponsorship cancellation or status mutation.

## 4. Completion Notes

_To be filled in after implementation._
