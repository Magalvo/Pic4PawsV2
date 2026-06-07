# Work-Item: PET-PROFILE-WORKER-001 — Public Pet Profile Worker Route

## 1. Context & Problem

The Worker serves `GET /pets` (published pet feed list) but has no route to retrieve a single
pet's full profile by ID. Adopter and shelter views need a public `GET /pets/:petId` endpoint
that returns the complete published record — including the `medical` field — for one pet.

Without this route no client can render a pet detail page, blocking the profile view, sharing
links, and the adoption-flow entry point.

## 2. Acceptance Criteria

- [ ] Add a `GET /pets/:petId` route that returns a single published pet profile.
- [ ] The route requires no authentication — it is a public endpoint.
- [ ] Success response is `{ status: 'ok', pet: PublishedPetProfile }` with HTTP 200.
- [ ] `PublishedPetProfile` contains all `PublishedPetSummary` fields plus `medical: PublicPetMedicalStatus`.
- [ ] Returns 404 `{ status: 'pet_not_found' }` when the pet does not exist, is not published, or is soft-deleted.
- [ ] Non-GET methods return 405 `{ status: 'method_not_allowed', allowedMethods: ['GET'] }`.
- [ ] Missing repository returns 501 `{ status: 'pet_profile_repository_not_configured' }`.
- [ ] Add `PetProfileRepository` interface and `matchWorkerPetProfileId` helper to `apps/workers/src/pet-profile.ts`.
- [ ] Add Supabase implementation of `PetProfileRepository` in `apps/workers/src/pet-supabase.ts`.
- [ ] Wire `petProfileRepository` into `WorkerRequestDependencies`.
- [ ] Profile route check runs AFTER the pet drafts prefix check — `/pets/drafts/*` is never mistaken for a profile request.
- [ ] No new env var required — profile path is derived from `config.workers.petFeedPath`.
- [ ] Tests use injected fake repositories — no real Supabase or network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not add authentication or shelter-owner profile views.
- Do not return sponsorship metadata or adoption-flow state.
- Do not implement CDN cache headers or edge caching.
- Do not implement a `GET /pets/drafts/:petId` public read (draft reads are authenticated).

## 4. Completion Notes

_To be filled in after implementation._
