# Work-Item: SHELTER-REGISTER-CLIENT-001 — Shelter Registration Client

status: done

## 1. Context & Problem

`SHELTER-REGISTER-WORKER-001` exposes `POST /shelters`.
Without a platform-neutral client adapter, Web and Mobile cannot call this endpoint.

## 2. Goal

Add `createShelterRegistrationClient` to `@pic4paws/client`.

## 3. States / Contract

**Failure statuses**: `unauthenticated | invalid_payload | auth_adapter_not_configured | shelter_registration_repository_not_configured | worker_request_failed`

**Success**: `{ ok: true; status: 'registered'; shelterId: string }`

## 4. Acceptance Criteria

- [ ] `ShelterRegistrationInput` type (name, kind, city, publicEmail?, publicPhone?, description?, district?)
- [ ] `RegisterShelterClientSuccess` / `RegisterShelterClientFailureStatus` / `RegisterShelterClientResult` types
- [ ] `CreateShelterRegistrationClientInput` type (workerBaseUrl, shelterPath, getAccessToken, fetch)
- [ ] `ShelterRegistrationClient` type with `registerShelter(input)`
- [ ] `createShelterRegistrationClient` factory:
  - Returns `unauthenticated` when `getAccessToken()` resolves to null/empty
  - URL: `{workerBaseUrl}{shelterPath}` (e.g. `https://workers.pic4paws.pt/shelters`)
  - POST with `Authorization: Bearer {token}` + JSON body
  - Network throw → `worker_request_failed` + `network_error`
  - 400 → `invalid_payload`
  - 401 → `unauthenticated`
  - 501 → `auth_adapter_not_configured` or `shelter_registration_repository_not_configured`
  - Non-ok → parse failure status + `sanitizeReasons`
  - 201 valid body → `RegisterShelterClientSuccess`
- [ ] Tests use injected fake fetch — no real network calls
- [ ] Sanitization test asserts both `service-role` and `bearer` pattern substrings absent

## 5. Affected Files

- `packages/client/src/index.ts`
- `tests/client/shelter-register-client.test.ts` (new)
