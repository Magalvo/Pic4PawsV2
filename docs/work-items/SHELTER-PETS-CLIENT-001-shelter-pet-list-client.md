# Work-Item: SHELTER-PETS-CLIENT-001 — Shelter Pet List Client

status: done

## 1. Context & Problem

`SHELTER-PETS-WORKER-001` exposes `GET /shelters/:shelterId/pets`.
Without a platform-neutral client adapter, Web and Mobile cannot call this endpoint.

## 2. Goal

Add `createShelterPetListClient` to `@pic4paws/client`.

## 3. States / Contract

**Failure statuses**: `unauthenticated | forbidden | shelter_pet_list_repository_not_configured | auth_adapter_not_configured | worker_request_failed | worker_response_invalid`

**Success**: `{ ok: true, status: 'ok', pets: ShelterPetClientSummary[], total: number }`

## 4. Acceptance Criteria

- [ ] `ShelterPetStatus` union (6 values) in `@pic4paws/client`
- [ ] `ShelterPetClientSummary` type (petId, name, species, status, heroMediaId, locationLabel, createdAt, updatedAt)
- [ ] `ShelterPetListQuery` type (limit?, offset?)
- [ ] `ShelterPetListClientSuccess` / `ShelterPetListClientFailureStatus` / `ShelterPetListClientResult` types
- [ ] `CreateShelterPetListClientInput` type (workerBaseUrl, shelterPath, getAccessToken, fetch)
- [ ] `ShelterPetListClient` type with `loadShelterPets(shelterId, query?)`
- [ ] `createShelterPetListClient` factory:
  - Returns `unauthenticated` when `getAccessToken()` resolves to null/empty
  - URL: `{workerBaseUrl}/{shelterPath}/{shelterId}/pets` via `createWorkerSubUrl`
  - Appends limit/offset as query params when non-null
  - GET with `Authorization: Bearer {token}`
  - Network throw → `worker_request_failed` + `network_error`
  - Non-ok response → parse failure status + `sanitizeReasons`
  - Ok but invalid body → `worker_response_invalid`
  - Ok valid body → `ShelterPetListClientSuccess`
- [ ] Tests use injected fake fetch — no real network calls
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## 5. Affected Files

- `packages/client/src/index.ts`
- `tests/client/shelter-pet-list-client.test.ts` (new)
