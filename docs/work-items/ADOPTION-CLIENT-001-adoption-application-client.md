# Work-Item: ADOPTION-CLIENT-001 — Adoption Application Client

## 1. Context & Problem

`ADOPTION-WORKER-001` (merged) adds `POST /adoptions` to the Worker. Web and Mobile product
boundaries need a shared, platform-neutral client to submit adoption applications. Without
it, neither boundary can call the Worker and the adoption write path is incomplete.

## 2. Acceptance Criteria

- [ ] Add adoption types to `packages/client/src/index.ts`:
  - `HousingType` type union.
  - `AdoptionApplicationClientInput` — all applicant, housing, consent fields
    (mirrors `CreateAdoptionApplicationInput` from the Worker, excluding server-derived
    fields: `shelterId`, `applicantUserId`, `status`, `submittedAt`).
  - `AdoptionApplicationClientSuccess` — `{ ok: true; status: 'adoption_application_submitted'; applicationId; petId; shelterId; submittedAt }`.
  - `AdoptionApplicationClientFailureStatus` union.
  - `AdoptionApplicationClientFailure`.
  - `AdoptionApplicationClientResult`.
  - `CreateAdoptionApplicationClientInput` — `{ workerBaseUrl; adoptionsPath; getAccessToken; fetch }`.
  - `AdoptionApplicationClient` — `{ submitApplication }`.
- [ ] Export `createAdoptionApplicationClient` factory.
- [ ] `submitApplication` sends `POST {adoptionsPath}` with `Authorization: Bearer <token>`.
- [ ] Returns `unauthenticated` early when `getAccessToken()` returns no token.
- [ ] Maps Worker failure statuses to typed client failure statuses:
  `unauthenticated`, `pet_not_found`, `invalid_adoption_application`,
  `adoption_repository_not_configured`, `auth_adapter_not_configured`, `worker_request_failed`.
- [ ] Returns `worker_response_invalid` when 201 response body is malformed.
- [ ] Network throws mapped to `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }`.
- [ ] All failure reasons sanitized through `sanitizeReasons` (credential-marker stripping).
- [ ] Tests use injected fake `fetch` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement polling or optimistic updates.
- Do not implement application status checking.
- Do not add Supabase or auth adapter imports.

## 4. Completion Notes

_To be filled in after implementation._
