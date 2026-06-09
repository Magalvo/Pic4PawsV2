# Work-Item: DONOR-ADOPTION-LIST-WORKER-001 — Donor Adoption List Worker Route

## 1. Context & Problem

Adopters need to see their own adoption applications. The existing `ADOPTION-LIST-WORKER-001`
route (`GET /shelters/:shelterId/adoptions`) is shelter-side only (requires shelter membership).

This item adds a donor-facing `GET /adoptions` route — same path as `POST /adoptions` but
method-switched — returning the authenticated actor's own applications with no shelter
membership requirement.

## 2. Acceptance Criteria

- [ ] `AdoptionDonorListSummary` type defined with `applicationId`, `petId`, `shelterId`, `status`, `submittedAt` (no `applicantUserId` — GDPR).
- [ ] `ListDonorAdoptionsQuery` type defined with `donorUserId`, `limit?`, `offset?`.
- [ ] `ListDonorAdoptionsResult` type defined with `applications`, `total`.
- [ ] `AdoptionDonorListRepository` interface defined with `listDonorAdoptions`.
- [ ] `handleWorkerAdoptionDonorListRequest` handler: auth required, pagination, no shelter membership check.
- [ ] Supabase implementation queries `adoption_applications WHERE applicant_user_id = donorUserId ORDER BY submitted_at DESC`.
- [ ] Route wired in `apps/workers/src/index.ts` as GET method-switch before existing POST adoption block.
- [ ] `adoptionDonorListRepository` added to `WorkerRequestDependencies`.
- [ ] Response never includes `applicantUserId` or other applicant PII.
- [ ] Tests covering: success, unauthenticated, 501 (no auth adapter), 501 (no repository), empty list.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No shelter-side features (that is `ADOPTION-LIST-WORKER-001`).
- No adoption detail view (that is `ADOPTION-VIEW-WORKER-001`).
- No client or UI boundaries (separate work items).

## 4. Completion Notes

Implemented in commit `293dc37` on branch `agent/donor-adoption-list-batch`.

- `apps/workers/src/adoption-donor-list.ts` — `AdoptionDonorListSummary` (no PII), `ListDonorAdoptionsQuery`, `ListDonorAdoptionsResult`, `AdoptionDonorListRepository`, `handleWorkerAdoptionDonorListRequest`.
- `apps/workers/src/adoption-donor-list-supabase.ts` — Supabase impl querying `adoption_applications WHERE applicant_user_id = donorUserId ORDER BY submitted_at DESC`.
- `apps/workers/src/dependencies.ts` — wired `createSupabaseAdoptionDonorListRepositories`, added `adoptionDonorListRepository` to `WorkerRequestDependencies`.
- `apps/workers/src/index.ts` — GET method-switch added before existing POST adoption block.
- `tests/workers/adoption-donor-list.test.ts` — 8 tests.
- `tests/workers/adoption.test.ts` — updated stale 405 test to expect 501 (GET now routed to donor list handler).
