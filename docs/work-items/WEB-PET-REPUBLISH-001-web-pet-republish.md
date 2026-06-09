# Work-Item: WEB-PET-REPUBLISH-001 — Web Pet Re-publish Product Boundary

## 1. Context & Problem

`PET-REPUBLISH-WORKER-001` + `PET-REPUBLISH-CLIENT-001` added the re-publish capability at
worker and client layers. The web product boundary (`createWebPetArchiveUi`) only exposes
`archivePet`. This item adds `republishPet` so shelter staff can restore a pet from
`archived → published` from the Web UI.

## 2. Acceptance Criteria

- [ ] `WebPetArchivePublishedState` type defined with `state: 'published'`, `title`, `message`, `petId`.
- [ ] `WebPetArchiveResultViewModel` union extended to include `WebPetArchivePublishedState`.
- [ ] `WebPetArchiveFailedState.status` widened to `PetArchiveClientFailureStatus | PetRepublishClientFailureStatus`.
- [ ] `webPetArchiveUiContent.states` gains a `published` entry (PT-PT copy).
- [ ] `createWebPetArchiveUi` factory `Pick` extended to include `'republishPet'`.
- [ ] `republishPet(petId)` action added to factory — success → `published` state, failure → `failed` state.
- [ ] Tests covering: republishPet success, republishPet pet_not_archived failure, content has published state.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No Mobile boundary changes (separate work item MOBILE-PET-REPUBLISH-001).
- No new foundation entry — petArchive foundation entry already registered.

## 4. Completion Notes

Implemented in `apps/web/src/pet-archive.ts`.

New exported type: `WebPetArchivePublishedState` — `{ state: 'published'; title; message; petId }`.

`WebPetArchiveResultViewModel` union extended with `WebPetArchivePublishedState`.

`WebPetArchiveFailedState.status` widened to
`PetArchiveClientFailureStatus | PetRepublishClientFailureStatus`.

`webPetArchiveUiContent.states` gained a `published` entry with PT-PT copy
("Animal publicado! / O animal voltou a estar disponível para adoção.") — now 5 states total.

`createWebPetArchiveUi` factory:
- `Pick` extended to `'archivePet' | 'republishPet'`
- `republishPet(petId)` action added — success → `published` state, failure → `failed` state

`tests/web/pet-archive-ui.test.ts`: updated states-count assertion (4 → 5), added 4 new
tests under `web pet archive UI — republishPet` (14 total in the file).

Merged via PR #<!-- PR number to be filled in -->.
