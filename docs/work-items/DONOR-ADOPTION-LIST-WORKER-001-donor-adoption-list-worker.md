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

<!-- To be filled in when merged -->
