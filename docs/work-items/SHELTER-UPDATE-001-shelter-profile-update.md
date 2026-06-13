# Work-Item: SHELTER-UPDATE-001 — Shelter Profile Update

status: done

## 1. Context & Problem

`SHELTER-REGISTER-001` lets owners register a shelter. Without an update endpoint, shelter
owners cannot correct or enrich their shelter's profile after registration.

## 2. Goal

Add `PATCH /shelters/:shelterId` so authenticated shelter members can update editable
profile fields (name, kind, city, district, publicEmail, publicPhone, description).

## 3. States / Contract

**Failure statuses**: `unauthenticated | forbidden | invalid_payload | shelter_not_found | auth_adapter_not_configured | shelter_update_repository_not_configured | worker_request_failed`

**Success**: `{ ok: true; status: 'updated'; shelterId: string }`

**Boundary states**: `idle | submitting | updated | failed`

- `idle`: form ready — `title`
- `submitting`: in-flight — `title`
- `updated`: success — `title`, `message`, `shelterId`
- `failed`: `title`, `message`, `status`, `reasons`, `canRetry: true`

## 4. Acceptance Criteria

### Worker
- [ ] `apps/workers/src/shelter-update.ts` (new):
  - `ShelterUpdateInput` type (all fields optional, at least one required)
  - `ShelterUpdateRepository` type with `updateShelter(shelterId, input, actorUserId)`
  - `validateShelterUpdatePayload` — returns `{ valid: true; input }` or `{ valid: false; reasons }` — rejects empty object
  - `handleWorkerShelterUpdateRequest` handler:
    - 405 for non-PATCH
    - 401 for missing/invalid token
    - 501 for missing authenticator
    - 403 for `!canManageShelter(actor, shelterId)`
    - 400 for invalid payload
    - 501 for missing repository
    - 404 if shelter not found
    - 200 `{ status: 'updated', shelterId }`
- [ ] `apps/workers/src/shelter-update-supabase.ts` (new):
  - UPDATE shelters WHERE id = shelterId with only the provided fields
  - Returns `null` when no rows updated (shelter not found)
  - Throws `SupabaseShelterUpdateRepositoryError` on Supabase error
- [ ] `apps/workers/src/dependencies.ts` — add `shelterUpdateRepository`
- [ ] `apps/workers/src/index.ts` — intercept PATCH inside the `shelterProfileId !== null` block, before the GET handler; add imports and exports

### Client
- [ ] `packages/client/src/index.ts` — add `ShelterUpdateClientInput`, `UpdateShelterClientSuccess`, `UpdateShelterClientFailureStatus`, `UpdateShelterClientResult`, `ShelterUpdateClient`, `createShelterUpdateClient`
  - PATCH `{workerBaseUrl}{shelterPath}/{shelterId}`
  - Authorization Bearer header
  - 200 → `updated`, 400 → `invalid_payload`, 401 → `unauthenticated`, 403 → `forbidden`, 404 → `shelter_not_found`, 501 → configured failure statuses, network throw → `worker_request_failed`

### Web boundary
- [ ] `apps/web/src/shelter-update.ts` (new):
  - `WebShelterUpdateUiContent` + `webShelterUpdateUiContent` (PT-PT, product-flow-ready)
  - `createWebShelterUpdateUi({ shelterUpdateClient })` — `getInitialState()` + `updateShelter(shelterId, input)`
  - Distinct PT-PT copy for `forbidden` and `shelter_not_found`; sanitize generic failures
- [ ] `apps/web/src/foundation.ts` — add `shelterUpdate` entry

### Mobile boundary
- [ ] `apps/mobile/src/shelter-update.ts` (new) — same as Web with `Mobile` prefix
- [ ] `apps/mobile/src/foundation.ts` — add `shelterUpdate` entry

### Tests
- [ ] `tests/workers/shelter-update.test.ts` — validateShelterUpdatePayload + handler (all status codes)
- [ ] `tests/workers/shelter-update-supabase.test.ts` — UPDATE call, null on missing shelter, error propagation
- [ ] `tests/client/shelter-update-client.test.ts` — all status codes, URL shape, sanitization
- [ ] `tests/web/shelter-update-ui.test.ts` — all states + sanitization
- [ ] `tests/mobile/shelter-update-ui.test.ts` — all states + sanitization

## 5. Affected Files

- `apps/workers/src/shelter-update.ts` (new)
- `apps/workers/src/shelter-update-supabase.ts` (new)
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/index.ts`
- `packages/client/src/index.ts`
- `apps/web/src/shelter-update.ts` (new)
- `apps/web/src/foundation.ts`
- `apps/mobile/src/shelter-update.ts` (new)
- `apps/mobile/src/foundation.ts`
- `tests/workers/shelter-update.test.ts` (new)
- `tests/workers/shelter-update-supabase.test.ts` (new)
- `tests/client/shelter-update-client.test.ts` (new)
- `tests/web/shelter-update-ui.test.ts` (new)
- `tests/mobile/shelter-update-ui.test.ts` (new)
