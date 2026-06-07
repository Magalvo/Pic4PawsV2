# Work-Item: PET-PROFILE-CLIENT-001 — Public Pet Profile Client

## 1. Context & Problem

The Worker now exposes `GET /pets/:petId` (merged via PET-PROFILE-WORKER-001). No client wrapper
exists in `@pic4paws/client` for that route. Web and Mobile boundaries cannot call the profile
route until a typed, tested client is available.

## 2. Acceptance Criteria

- [ ] Add `PetProfilePet` type to `@pic4paws/client` — mirrors `PublishedPetProfile` from the Worker.
- [ ] Add `PetProfileClient` with a single `loadProfile(petId: string)` method.
- [ ] Success result is `{ ok: true; status: 'ok'; pet: PetProfilePet }`.
- [ ] Failure statuses: `'pet_not_found'` (HTTP 404), `'worker_request_failed'` (other non-ok), `'worker_response_invalid'` (malformed 200 body).
- [ ] Network errors return `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }`.
- [ ] `CreatePetProfileClientInput` accepts `workerBaseUrl`, `petFeedPath: /${string}`, and `fetch`.
- [ ] No access token — the profile route is public.
- [ ] Three-layer credential sanitization applied to failure reasons (same as other clients).
- [ ] Tests use injected `fetch` mock — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not add authentication or shelter-scoped profile views.
- Do not cache responses client-side.
- Do not implement list or feed operations (covered by PetFeedClient).

## 4. Completion Notes

_To be filled in after implementation._
