# Work-Item: ADOPTION-WORKER-001 — Adoption Application Worker Route

## 1. Context & Problem

The adopter discovery loop (feed → pet profile → shelter profile) is complete.
The next step for adopters is submitting an adoption application. The Worker has no
`POST /adoptions` endpoint. Without it, no client can submit an application and the
adoption flow cannot be started.

The `adoption_applications` table is already defined in `packages/database/src/schema.ts`.

## 2. Acceptance Criteria

- [ ] Add `WORKER_ADOPTIONS_PATH` env var (default `/adoptions`) to `packages/config/src/env.ts`.
- [ ] Add `apps/workers/src/adoption.ts` with:
  - `HousingType` type union.
  - `AdoptionApplicationPetContext` (petId, shelterId).
  - `CreateAdoptionApplicationInput` with all applicant, housing, consent fields.
  - `CreateAdoptionApplicationResult` (applicationId, submittedAt).
  - `AdoptionApplicationRepository` interface with `loadPetForApplication` and
    `createApplication`.
  - `validateAdoptionPayload` — validates the raw JSON body, enforces
    `dataProcessingAccepted === true`.
  - `handleWorkerAdoptionRequest` — authenticated POST handler.
- [ ] `handleWorkerAdoptionRequest` returns:
  - 405 for non-POST.
  - 401 if no bearer token or auth fails.
  - 501 if authenticator is not configured.
  - 400 if payload is invalid (missing fields or `dataProcessingAccepted` is not `true`).
  - 501 if `adoptionRepository` is not configured.
  - 404 `{ status: 'pet_not_found' }` if pet is not published/found.
  - 201 `{ status: 'adoption_application_submitted', applicationId, petId, shelterId, submittedAt }`.
- [ ] `shelterId` is derived server-side from the pet record — never trusted from the client.
- [ ] `applicantUserId` comes from the authenticated actor — never from the payload.
- [ ] `submittedAt` is injected via `now` — clock is not called inside the handler.
- [ ] Add `apps/workers/src/adoption-supabase.ts`:
  - `SupabaseAdoptionRepositoryError`.
  - `createSupabaseAdoptionRepositories` — implements `AdoptionApplicationRepository` against
    Supabase.
  - `loadPetForApplication` queries `pets` filtering `status = 'published'` and
    `deleted_at IS NULL`.
  - `createApplication` inserts into `adoption_applications` with `status = 'submitted'`.
- [ ] Wire `adoptionRepository` into `WorkerRequestDependencies`,
  `createWorkerSupabaseDependencies`, and `resolveWorkerRequestDependencies`.
- [ ] Wire the adoption route in `apps/workers/src/index.ts` at
  `config.workers.adoptionsPath`.
- [ ] Export adoption types and handler from `apps/workers/src/index.ts`.
- [ ] Tests use injected fakes — no real network or DB calls.
- [ ] All tests fail before implementation, pass after.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement GET /adoptions or /adoptions/:id routes.
- Do not send confirmation emails or notifications.
- Do not implement shelter-side review endpoints.
- Do not implement payment for adoption (separate slice).

## 4. Completion Notes

_To be filled in after implementation._
