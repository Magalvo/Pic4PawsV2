# Work-Item: MOBILE-PET-REPUBLISH-001 — Mobile Pet Re-publish Product Boundary

## 1. Context & Problem

`WEB-PET-REPUBLISH-001` added `republishPet` to `createWebPetArchiveUi`. This item
mirrors that change in `createMobilePetArchiveUi` so shelter staff can restore a pet
from `archived → published` via the Mobile app.

## 2. Acceptance Criteria

- [ ] `MobilePetArchivePublishedState` type defined with `state: 'published'`, `title`, `message`, `petId`.
- [ ] `MobilePetArchiveResultViewModel` union extended to include `MobilePetArchivePublishedState`.
- [ ] `MobilePetArchiveFailedState.status` widened to `PetArchiveClientFailureStatus | PetRepublishClientFailureStatus`.
- [ ] `mobilePetArchiveUiContent.states` gains a `published` entry (PT-PT copy).
- [ ] `createMobilePetArchiveUi` factory `Pick` extended to include `'republishPet'`.
- [ ] `republishPet(petId)` action added — success → `published` state, failure → `failed` state.
- [ ] Tests covering: republishPet success, republishPet pet_not_archived failure, content has published state.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No foundation changes — petArchive foundation entry already registered.

## 4. Completion Notes

Implemented in `apps/mobile/src/pet-archive.ts`. Direct mirror of `WEB-PET-REPUBLISH-001`.

New exported type: `MobilePetArchivePublishedState` — `{ state: 'published'; title; message; petId }`.

`MobilePetArchiveResultViewModel` union extended with `MobilePetArchivePublishedState`.

`MobilePetArchiveFailedState.status` widened to
`PetArchiveClientFailureStatus | PetRepublishClientFailureStatus`.

`mobilePetArchiveUiContent.states` gained a `published` entry with PT-PT copy
("Animal publicado! / O animal voltou a estar disponível para adoção.") — now 5 states total.

`createMobilePetArchiveUi` factory:
- `Pick` extended to `'archivePet' | 'republishPet'`
- `republishPet(petId)` action added — success → `published` state, failure → `failed` state

`tests/mobile/pet-archive-ui.test.ts`: updated states-count assertion (4 → 5), added 4 new
tests under `mobile pet archive UI — republishPet` (16 total in the file).

Merged via PR #<!-- PR number to be filled in -->.
