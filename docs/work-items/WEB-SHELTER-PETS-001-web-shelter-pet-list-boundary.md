# Work-Item: WEB-SHELTER-PETS-001 — Web Shelter Pet List Boundary

status: done

## 1. Context & Problem

`SHELTER-PETS-CLIENT-001` provides the client adapter. Without a Web product boundary,
shelter staff cannot list their pets from the web dashboard.

## 2. Goal

Expose `createWebShelterPetListUi` with PT-PT states for shelter staff to browse their pets.

## 3. States / Contract

**States**: `idle | loading | loaded | empty | forbidden | failed`

## 4. Acceptance Criteria

- [ ] `apps/web/src/shelter-pet-list.ts`:
  - `WebShelterPetListUiContent` type + `webShelterPetListUiContent` constant (PT-PT, product-flow-ready)
  - `createWebShelterPetListUi({ shelterPetListClient })` returning `getInitialState()` + `loadShelterPets(shelterId, query?)`
  - `forbidden` → distinct PT-PT message
  - `empty` → distinct PT-PT message
  - `failed` → `sanitizeReasons`, `canRetry: true`
  - `unsafeReasonMarkers` including `service-role`, `bearer`, `r2-secret`, `r2-access`, `user-access-token`
- [ ] Web foundation entry added (`shelterPetList`)
- [ ] Tests: getInitialState, loaded, empty, forbidden, failed, sanitization (service-role + bearer absent)
- [ ] Final validation gates pass

## 5. Affected Files

- `apps/web/src/shelter-pet-list.ts` (new)
- `apps/web/src/foundation.ts`
- `tests/web/shelter-pet-list-ui.test.ts` (new)
