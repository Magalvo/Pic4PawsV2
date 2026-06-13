# SHELTER-REGISTER-RPC-HARDEN-001 — Harden `register_shelter` RPC

**status**: open
**created**: 2026-06-13
**priority**: P0/P1

## Goal

Harden the `register_shelter` Supabase RPC function and add it to the migration artifact
pipeline. The function is currently a `security definer` function with no fixed
`search_path`, no execute revocation from public roles, and accepts `p_role` and
`p_verification_status` as caller-supplied parameters — any Supabase/PostgREST caller
with execute access could bypass the Worker contract and create shelters or memberships
directly.

## Findings being addressed

- **D1**: `register_shelter` has no `set search_path`, no `REVOKE EXECUTE`, and no
  fixed safe values for `p_verification_status` / `p_role`.
- **D2**: `registerShelterRpcSql` exists in `packages/database/src/rpc-functions.ts`
  but is not in `migrationArtifacts` — a fresh environment may fail at runtime unless
  the RPC is manually applied.

## Contract

### SQL changes (in `packages/database/src/rpc-functions.ts`)

- Add `SET search_path = public` to the function definition.
- Use schema-qualified table names (`public.shelters`, `public.shelter_memberships`).
- Remove `p_verification_status` and `p_role` parameters — hardcode
  `verification_status = 'draft'` and `role = 'shelter_owner'` inside the function body.
- Add `REVOKE EXECUTE ON FUNCTION register_shelter(...) FROM PUBLIC, anon, authenticated;`
- Add `GRANT EXECUTE ON FUNCTION register_shelter(...) TO service_role;`

### Migration artifact (in `packages/database/src/migration-artifacts.ts`)

- Create a new `MigrationArtifact` entry for the RPC function.
- Add it to `migrationArtifacts` array (after the existing migrations).
- The artifact must be non-destructive on re-run (`CREATE OR REPLACE FUNCTION`).

### Worker adapter (in `apps/workers/src/shelter-register-supabase.ts`)

- Remove `p_verification_status` and `p_role` from the `client.rpc('register_shelter', {...})` call.
- The function now hardcodes those values — the Worker no longer passes them.

### Tests

- Update `tests/workers/shelter-register-supabase.test.ts` to stop passing
  `p_verification_status` and `p_role` in the mock calls.
- Add tests to `packages/database/src/*.test.ts` (or equivalent) asserting:
  - `migrationArtifacts` includes an artifact that references `register_shelter`.
  - The SQL string includes `SET search_path`, schema-qualified names, `REVOKE EXECUTE`, `GRANT EXECUTE`.

## Affected files

| File | Change |
|---|---|
| `packages/database/src/rpc-functions.ts` | harden SQL: search_path, schema-qualified names, hardcoded params, REVOKE/GRANT |
| `packages/database/src/migration-artifacts.ts` | add RPC migration artifact |
| `apps/workers/src/shelter-register-supabase.ts` | remove `p_verification_status` + `p_role` from rpc call |
| `tests/workers/shelter-register-supabase.test.ts` | update mock calls |
| `tests/database/migration-artifacts.test.ts` | new — assert RPC included in artifacts |
