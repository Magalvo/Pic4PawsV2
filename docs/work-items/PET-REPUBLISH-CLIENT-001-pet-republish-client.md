# Work-Item: PET-REPUBLISH-CLIENT-001 — Pet Re-publish Client

## 1. Context & Problem

`PET-REPUBLISH-WORKER-001` extended `PATCH /pets/:petId/status` to accept `published`.

The `PetArchiveClient` in `@pic4paws/client` only exposes `archivePet`. This item adds
`republishPet(petId)` to the same client so Web and Mobile boundaries can trigger re-publish.

## 2. Acceptance Criteria

- [ ] `PetRepublishClientSuccess` type defined with `ok: true`, `status: 'ok'`, `petId`.
- [ ] `PetRepublishClientFailureStatus` union defined (includes `pet_not_archived`).
- [ ] `PetRepublishClientResult` discriminated union defined.
- [ ] `PetArchiveClient` type gains `republishPet: (petId: string) => Promise<PetRepublishClientResult>`.
- [ ] `createPetArchiveClient` factory implements `republishPet` — sends `PATCH …/status` with `{ status: 'published' }`.
- [ ] Maps 409 `pet_not_archived` to typed failure.
- [ ] Maps unauthenticated, forbidden, not_found, and network failures.
- [ ] Tests covering: success, `pet_not_archived` 409, unauthenticated, network error.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No UI boundary changes (separate work items).

## 4. Completion Notes

Implemented in `packages/client/src/index.ts`.

New exported types: `PetRepublishClientSuccess`, `PetRepublishClientFailureStatus`,
`PetRepublishClientFailure`, `PetRepublishClientResult`.

`PetArchiveClient` type gained `republishPet: (petId: string) => Promise<PetRepublishClientResult>`.

`createPetArchiveClient` factory implements `republishPet` — sends
`PATCH {petFeedPath}/{petId}/status` with `{ status: 'published' }` and a Bearer token.
Maps 409 `pet_not_archived` to the new typed failure; shares unauthenticated / network /
response-invalid branches with `archivePet`.

8 new tests added to `tests/client/pet-archive-client.test.ts` under
`createPetArchiveClient — republishPet` (20 total in the file).

Merged via PR #<!-- PR number to be filled in -->.
