# Work-Item: PET-DB-001-Pet Draft Persistence Contract

## 1. Context & Problem

`PET-MEDIA-001` made pet publishing depend on persisted public media assets. The next backend step is a database-facing contract for creating and updating pet drafts with those attached media IDs, without introducing Supabase writes, Worker routes or client UI yet.

Pet drafts are allowed to be incomplete before publishing, so the database schema and persistence contract must not force public listing fields such as name, species, location or short description at draft creation time.

## 2. Acceptance Criteria

- [x] Pet draft insert contracts can persist incomplete drafts with nullable public listing fields.
- [x] Pet draft update contracts preserve draft-only writes and reject non-draft pet records.
- [x] Attached media IDs are accepted only when they resolve to same-shelter, non-deleted, public image media assets.
- [x] `heroMediaId` must be null or one of the attached `mediaIds`.
- [x] Duplicate media IDs are rejected before generating a database update contract.
- [x] The Drizzle schema and initial SQL artifact allow draft public listing fields to be nullable.
- [x] Tests fail before implementation and pass after the persistence contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Supabase.
- Do not add Worker API routes.
- Do not implement pet creation UI.
- Do not publish pets from the database layer.
- Do not mutate live records or run migrations against a database.

## 4. Completion Notes

- Added pure pet draft insert/update persistence contracts in `@pic4paws/database`.
- Draft public listing fields now remain nullable at database schema and initial SQL artifact level.
- Persistence validation rejects non-draft writes, duplicate media IDs, detached hero media and invalid attached media.
- No Supabase writes, Worker routes, migrations against a live database or UI were added.
