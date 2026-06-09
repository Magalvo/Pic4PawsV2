# Work-Item: PET-ARCHIVE-CLIENT-001 — Pet Archive Client

## 1. Context & Problem

`PET-ARCHIVE-WORKER-001` added `PATCH /pets/:petId` to the Worker, accepting
`{ status: 'archived' | 'published' }` to toggle a pet's visibility.

Web and Mobile product boundaries need a shared, platform-neutral client wrapping both
operations. Without it, each platform reimplements HTTP wiring, token injection, and
failure classification for archival and unarchival separately.

## 2. Acceptance Criteria

- [x] `createPetArchiveClient({ workerBaseUrl, petsPath, getAccessToken, fetch })` added to `@pic4paws/client`.
- [x] Two methods exported: `archivePet(petId)` and `unarchivePet(petId)`.
- [x] Both methods send `PATCH {petsPath}/{petId}` with appropriate `status` payload.
- [x] Return type `PetArchiveClientResult` with `ok: true | false` discriminant.
- [x] 7 failure statuses: `unauthenticated | forbidden | pet_not_found | invalid_pet_archive | worker_request_failed | worker_response_invalid | unknown`.
- [x] 401 worker response maps to `unauthenticated`.
- [x] 403 maps to `forbidden`.
- [x] 404 maps to `pet_not_found`.
- [x] 409 (`pet_already_archived`) maps to `invalid_pet_archive`.
- [x] Network/fetch failures map to `worker_request_failed`.
- [x] Response never surfaces raw error messages or server internals.
- [x] 10 tests covering both methods and all failure branches.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile UI boundaries (separate work items).
- Do not call Supabase or R2 directly from the client.

## 4. Completion Notes

Implemented on branch `agent/PET-ARCHIVE-CLIENT-001`. Merged as PR #91.
