---
audited-through: f59d829
prs: 138
score: pending
---

# SDD Audit Recheck - PR #138 (2026-06-13)

## 1. Scope

This recheck was performed after PR #138 (`SHELTER-DELETE-001`) was merged to `main`.

Audited HEAD:

- `f59d829` - `Merge pull request #138 from Magalvo/agent/SHELTER-DELETE-001`

Focused validation run:

- `tests/workers/shelter-delete.test.ts`
- `tests/workers/shelter-delete-supabase.test.ts`
- `tests/workers/pet-feed-supabase.test.ts`

Result: 3 files passed, 17 tests passed.

Full validation was not run during this recheck.

## 2. Findings

### D1 - `register_shelter` RPC is unsafe if deployed as-is

Severity: P0/P1

Files:

- `packages/database/src/rpc-functions.ts`
- `apps/workers/src/shelter-register-supabase.ts`

`register_shelter` is defined as a `security definer` function, but the SQL does not set a fixed `search_path`, does not revoke execution from `public`/`anon`/`authenticated`, and does not explicitly grant execution only to the trusted server role.

The function also accepts `p_user_id` and `p_role` as caller-supplied arguments. The Worker currently passes safe values, but if the function is exposed through Supabase/PostgREST with broad execute privileges, a client could potentially bypass the Worker contract and create shelters or memberships directly.

Recommended fix:

- Add `set search_path = public`.
- Use schema-qualified table names.
- Revoke execute from `public`, `anon`, and `authenticated`.
- Grant execute only to the role used by trusted server-side code.
- Consider hardcoding `verification_status = 'draft'` and `role = 'shelter_owner'` inside the function rather than accepting them as parameters.

### D2 - `register_shelter` RPC is not included in migration artifacts

Severity: P1

Files:

- `packages/database/src/migration-artifacts.ts`
- `packages/database/src/rpc-functions.ts`

`registerShelterRpcSql` exists as an exported SQL string, but `migrationArtifacts` still includes only:

- `initialDatabaseMigration`
- `notificationsMigration`

The Worker calls `client.rpc('register_shelter', ...)`, so a fresh environment may fail at runtime unless the RPC is manually applied outside the migration artifact flow.

Recommended fix:

- Add a non-destructive migration artifact for the RPC function.
- Add tests asserting `migrationArtifacts` includes the RPC migration.
- Render and validate the final SQL through the same artifact path used by the rest of the database setup.

### D3 - Shelter deletion hides pets from feed but not direct pet profile lookup

Severity: P1

File:

- `apps/workers/src/pet-supabase.ts`

PR #138 added a shelter `deleted_at` join filter to `petFeedRepository.loadPublishedPets`, which fixes the public feed visibility cascade.

However, `petProfileRepository.loadPublishedPet` still filters only:

- `pets.id`
- `pets.status = 'published'`
- `pets.deleted_at IS NULL`

It does not join/filter the owning shelter. A published pet under a soft-deleted shelter can likely remain visible through direct `GET /pets/:petId`.

Recommended fix:

- Add the same inner shelter join/filter to public pet profile lookup.
- Add tests proving direct pet profile returns `null` when the shelter is soft-deleted.

### D4 - Public pet feed/profile do not mirror verified-shelter RLS

Severity: P1/P2

Files:

- `apps/workers/src/pet-supabase.ts`
- `packages/database/src/rls-policies.ts`

Database RLS requires public pet reads to be both:

- `pets.status = 'published'`
- owning shelter has `verification_status = 'verified'`
- owning shelter has `deleted_at IS NULL`

The Worker repositories use service-role access and therefore must mirror those public visibility rules explicitly.

After PR #138:

- Feed checks shelter `deleted_at`, but not `verification_status`.
- Profile checks neither shelter `deleted_at` nor `verification_status`.

Recommended fix:

- Filter both feed and profile by `shelters.verification_status = 'verified'`.
- Keep the existing `shelters.deleted_at IS NULL` filter.
- Add tests for suspended/rejected/draft shelters on feed and direct profile routes.

### D5 - Public shelter profile exposes non-deleted shelters regardless of verification status

Severity: P2

File:

- `apps/workers/src/shelter-supabase.ts`

`shelterProfileRepository.loadShelterProfile` filters only by `id` and `deleted_at IS NULL`.

Unlike shelter search, it does not require `verification_status = 'verified'`. Since shelter registration creates `draft` shelters, public `GET /shelters/:shelterId` can expose public contact fields before review if the ID is known.

Recommended fix:

- Decide the intended product rule explicitly.
- If shelter profiles are public-only, filter by `verification_status = 'verified'`.
- If owner/staff preview is needed, add a separate authenticated preview/read route rather than widening the public route.

### D6 - Shelter deletion repository ignores `actorUserId`

Severity: P2/P3

Files:

- `apps/workers/src/shelter-delete.ts`
- `apps/workers/src/shelter-delete-supabase.ts`

The `ShelterDeletionRepository` contract accepts `actorUserId`, but the Supabase implementation ignores it and only updates by `shelterId`.

The handler authorization currently gates the operation correctly with `canDeleteShelter`, so this is not an immediate bypass. Still, for a service-role destructive operation, the persistence layer either should enforce the actor condition as defense-in-depth or the unused parameter should be removed from the repository contract to prevent false confidence.

Recommended fix:

- Prefer adding DB-level or repository-level owner/admin enforcement.
- Alternatively, remove `actorUserId` from the repository contract and document that authorization is exclusively handled before repository invocation.

### D7 - Worker dispatcher and client package are becoming route-order fragile

Severity: P2/P3

Files:

- `apps/workers/src/index.ts`
- `packages/client/src/index.ts`

Approximate file sizes after PR #138:

- `apps/workers/src/index.ts`: 1146 lines
- `packages/client/src/index.ts`: 4730 lines

The Worker dispatcher relies on manual ordering for many overlapping route matchers. This has worked because tests are strong, but the architecture is becoming increasingly brittle as more slices are added.

Recommended fix:

- Introduce a route registry or per-domain dispatch modules.
- Keep ordering rules executable through route-table tests.
- Split `@pic4paws/client` into domain modules while preserving package exports.

### D8 - Documentation drift remains after PR #138

Severity: P3

Files:

- `docs/work-tracks/remake-foundation.md`
- `docs/agent-resume.md`
- `docs/work-items/SHELTER-REGISTER-ATOMIC-001-atomic-shelter-registration.md`

Observed drift:

- `docs/work-tracks/remake-foundation.md` still references PR #121, 1287 tests, and `WORKER-ERROR-BOUNDARY-001` as the suggested next item.
- `docs/agent-resume.md` still recommends `SHELTER-DELETE-001`, even though PR #138 has merged it.
- `SHELTER-REGISTER-ATOMIC-001` has `status: done`, but its acceptance checklist remains unchecked.

Recommended fix:

- Add a docs housekeeping work item after PR #138.
- Update work-track, resume, latest checkpoint, and completed checklists.

## 3. Closed / Improved Since Prior Recheck

PR #138 successfully added:

- `DELETE /shelters/:shelterId` Worker route.
- Owner/admin-only deletion gate via `canDeleteShelter`.
- Supabase soft-delete adapter for `shelters.deleted_at`.
- `createShelterDeletionClient`.
- Web and Mobile shelter deletion boundaries.
- Focused tests for Worker, Supabase adapter, Web UI, Mobile UI.
- Public feed filtering for pets whose shelter has `deleted_at IS NULL`.

The earlier concern that the public feed data query might lack the `shelters!inner(...)` join is closed.

## 4. Suggested Priority Order

1. Harden and migrate `register_shelter` RPC.
2. Align public pet feed/profile visibility with verified, non-deleted shelter RLS.
3. Decide and enforce public shelter profile verification visibility.
4. Clarify or enforce `actorUserId` in shelter deletion repository.
5. Update docs after PR #138.
6. Plan dispatcher/client modularization before the next large feature wave.
