# Work-Item: PET-REPUBLISH-WORKER-001 — Pet Re-publish Worker Route

## 1. Context & Problem

`PET-ARCHIVE-001` added `PATCH /pets/:petId/status` with `{ status: 'archived' }`.
Shelters need to be able to re-publish an archived pet (transition `archived → published`).

This item extends the existing route to also accept `{ status: 'published' }`, adds
`republishPet` to `PetArchiveRepository`, and wires it into the Supabase implementation.

## 2. Acceptance Criteria

- [ ] `validatePetArchivePayload` now returns `'archived' | 'published' | null`.
- [ ] `PetArchiveRepository` gains `republishPet: ({ petId, now }) => Promise<{ petId: string } | null>`.
- [ ] Handler routes to `republishPet` when validated status is `'published'`.
- [ ] Handler returns 409 `pet_not_archived` when `republishPet` returns null (pet was not archived).
- [ ] Handler returns 200 `{ status: 'ok', petId }` on republish success.
- [ ] Supabase `republishPet` sets `lifecycle_status = 'published'`, clears `archived_at` where `lifecycle_status = 'archived'`.
- [ ] Invalid status values (e.g. `draft`, `adoption_pending`) still return 400.
- [ ] All existing archive tests continue to pass.
- [ ] New tests covering: republish success, `pet_not_archived` 409, `draft` status → 400.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No client or UI boundary changes (separate work items).
- No other status transitions (`adoption_pending`, `adopted`, `not_available`).
- No status history table.

## 4. Completion Notes

<!-- To be filled in when merged -->
