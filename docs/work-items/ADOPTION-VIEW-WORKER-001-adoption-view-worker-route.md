# Work-Item: ADOPTION-VIEW-WORKER-001 — Adoption View Worker Route

## 1. Context & Problem

`ADOPTION-LIST-WORKER-001` added a shelter-side list of adoption applications.
`ADOPTION-STATUS-WORKER-001` added shelter-side status management for individual applications.

Neither route lets an **adopter** inspect their own submitted application. The Worker needs a
read-only `GET /adoptions/:applicationId` route accessible by two principals:
- The adopter who submitted the application (owns the record)
- Any shelter staff member of the target shelter (needs to review it)

`applicantUserId` must be omitted from the response to avoid leaking PII to shelter staff.

## 2. Acceptance Criteria

- [x] `GET /adoptions/:applicationId` authenticated route added to the Worker.
- [x] Path matched by `matchWorkerAdoptionViewId(pathname, adoptionsPath)`.
- [x] Route registered at the same path as `PATCH /adoptions/:applicationId` (adoption status), method-switched so GET dispatches here and PATCH dispatches to status management.
- [x] `AdoptionViewRepository` interface defined: `getAdoptionForView(applicationId)`.
- [x] Supabase implementation (`AdoptionViewSupabaseRepository`) wired via dependency factory.
- [x] Dual access control: applicant (`actor.id === record.applicantUserId`) OR shelter staff (`canManageShelter(actor, record.shelterId)`).
- [x] `applicantUserId` field omitted from the 200 response body.
- [x] 401 when no or invalid Bearer token.
- [x] 404 when no application found with that id.
- [x] 403 when actor is neither the applicant nor shelter staff.
- [x] 501 when repository or auth adapter not configured.
- [x] 8 tests covering all access-control branches.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not allow the adopter to modify the application via this route.
- Do not expose `applicantUserId` in the response under any circumstance.
- Do not implement client or UI boundaries (separate work items).

## 4. Completion Notes

Implemented on branch `agent/ADOPTION-VIEW-WORKER-001`. Merged as PR #80.
