# Work-Item: ADOPTION-LIST-WORKER-001 — Shelter Adoption List Worker Route

## 1. Context & Problem

The adopter write path (`ADOPTION-WORKER-001`) is complete. Shelter members currently have
no way to retrieve the list of incoming adoption applications for their shelter. Without this
endpoint, the shelter-side adoption review flow cannot be built.

## 2. Acceptance Criteria

- [ ] Add `apps/workers/src/adoption-list.ts` with:
  - `AdoptionApplicationStatus` union type (8 statuses: draft, submitted, under_review,
    more_info_requested, approved, rejected, withdrawn, expired).
  - `AdoptionListSummary` type (applicationId, petId, applicantUserId, applicantFullName,
    applicantEmail, applicantCity, status, submittedAt).
  - `ListAdoptionApplicationsQuery` type (shelterId, limit?, offset?).
  - `ListAdoptionApplicationsResult` type (applications, total).
  - `AdoptionListRepository` interface with `listApplications`.
  - `matchWorkerAdoptionListShelterId(pathname, shelterPath)` — extracts `shelterId` from
    `{shelterPath}/{shelterId}/adoptions`; returns `null` for non-matching paths.
  - `HandleWorkerAdoptionListRequestInput` type and `handleWorkerAdoptionListRequest` handler.
- [ ] Handler flow (in order):
  1. 405 non-GET
  2. 401 missing bearer token
  3. 501 authenticator not configured
  4. 401 auth returns null
  5. 403 `canManageShelter(actor, shelterId)` fails
  6. 501 adoptionListRepository not configured
  7. Parse `limit` (default 20, max 100, min 1) and `offset` (default 0, min 0) from query params
  8. 200 `{ status: 'ok', applications, total }`
- [ ] Add `apps/workers/src/adoption-list-supabase.ts` with:
  - `SupabaseAdoptionListRepositoryError` class.
  - `createSupabaseAdoptionListRepositories({ client })` factory.
  - Supabase impl: single query against `adoption_applications` with `{ count: 'exact' }`,
    filtered by `shelter_id` and `deleted_at IS NULL`, ordered by `submitted_at DESC`,
    paginated with `.range()`.
- [ ] Wire `AdoptionListRepository` into `WorkerRequestDependencies` in `dependencies.ts`.
- [ ] Wire `createSupabaseAdoptionListRepositories` into `createWorkerSupabaseDependencies`.
- [ ] Add `matchWorkerAdoptionListShelterId` + `handleWorkerAdoptionListRequest` route to
  `handleWorkerRequest` in `index.ts` (before the existing `POST /adoptions` block).
- [ ] Export all new types and handlers from `index.ts`.
- [ ] Tests use injected fakes — no real network/DB calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement adoption status transitions (approve/reject).
- Do not implement the client package (`ADOPTION-LIST-CLIENT-001`).
- Do not implement Web or Mobile boundaries.

## 4. Completion Notes

_To be filled in after implementation._
