# Work-Item: SHELTER-PROFILE-CLIENT-001 — Shelter Profile Client

## 1. Context & Problem

`GET /shelters/:shelterId` is live in the Worker (SHELTER-PROFILE-WORKER-001). Web and Mobile
product boundaries cannot call that route without a typed client. Without a client, the shelter
profile screen cannot be built.

## 2. Acceptance Criteria

- [ ] Add `ShelterProfileClientShelter` type to `@pic4paws/client`:
  `id`, `name`, `slug`, `kind`, `verificationStatus`, `publicEmail`, `publicPhone`,
  `city`, `district`, `countryCode`, `description`, `logoMediaId`, `coverMediaId`.
- [ ] Export `ShelterProfileClientSuccess`, `ShelterProfileClientFailureStatus`,
  `ShelterProfileClientFailure`, `ShelterProfileClientResult`.
- [ ] Export `CreateShelterProfileClientInput` (`workerBaseUrl`, `shelterPath`, `fetch`).
- [ ] Export `ShelterProfileClient` with `loadProfile(shelterId: string)`.
- [ ] Export `createShelterProfileClient` factory function.
- [ ] `loadProfile` calls `GET {shelterPath}/{shelterId}` — no auth header.
- [ ] 404 response → `{ ok: false, status: 'shelter_not_found', ... }`.
- [ ] Non-ok, non-404 → `{ ok: false, status: 'worker_request_failed', ... }`.
- [ ] Network throw → `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }`.
- [ ] Malformed 200 → `{ ok: false, status: 'worker_response_invalid', ... }`.
- [ ] Failure reasons are sanitized through `sanitizeReasons` (defense-in-depth).
- [ ] Tests use injected fake `fetch` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement shelter listing / feed.
- Do not add authentication or shelter-owner views.
- Do not import types from `@pic4paws/workers` — client defines its own view of the response.

## 4. Completion Notes

_To be filled in after implementation._
