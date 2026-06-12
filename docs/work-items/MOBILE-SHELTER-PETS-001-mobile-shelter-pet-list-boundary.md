# Work-Item: MOBILE-SHELTER-PETS-001 — Mobile Shelter Pet List Boundary

status: done

## 1. Context & Problem

`SHELTER-PETS-CLIENT-001` provides the client adapter. Without a Mobile product boundary,
shelter staff cannot list their pets from the mobile app.

## 2. Goal

Expose `createMobileShelterPetListUi` with PT-PT states for shelter staff to browse their pets.

## 3. States / Contract

**States**: `idle | loading | loaded | empty | forbidden | failed`

## 4. Acceptance Criteria

- [ ] `apps/mobile/src/shelter-pet-list.ts`:
  - `MobileShelterPetListUiContent` type + `mobileShelterPetListUiContent` constant (PT-PT, product-flow-ready)
  - `createMobileShelterPetListUi({ shelterPetListClient })` returning `getInitialState()` + `loadShelterPets(shelterId, query?)`
  - Same state handling as Web boundary
- [ ] Mobile foundation entry added (`shelterPetList`)
- [ ] Tests: getInitialState, loaded, empty, forbidden, failed, sanitization (service-role + bearer absent)
- [ ] Final validation gates pass

## 5. Affected Files

- `apps/mobile/src/shelter-pet-list.ts` (new)
- `apps/mobile/src/foundation.ts`
- `tests/mobile/shelter-pet-list-ui.test.ts` (new)
