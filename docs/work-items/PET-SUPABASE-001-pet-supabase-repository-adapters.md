# Work-Item: PET-SUPABASE-001-Pet Supabase Repository Adapters

## 1. Context & Problem

`PET-WORKER-001` and `PET-PUBLISH-WORKER-001` added Worker contracts with injectable pet draft and publish repositories. The Worker still needs adapter contracts that translate those repository interfaces into Supabase table operations without exposing service-role secrets to clients or introducing live Supabase connectivity in tests.

The adapter must keep service-role usage server-side, map camelCase domain/database contracts to Supabase snake_case rows and preserve publish validation by loading persisted pet, media and shelter verification state.

## 2. Acceptance Criteria

- [x] A Supabase pet repository adapter can create draft rows in `pets`.
- [x] The adapter can update existing draft rows in `pets`.
- [x] The adapter can load attached media rows from `media_assets` scoped by shelter.
- [x] The publish adapter can load pet, media and shelter verification context without trusting client claims.
- [x] The publish adapter can persist successful published pet state to `pets`.
- [x] Adapter responses and errors do not expose service-role keys, bearer tokens or R2 secrets.
- [x] Tests use an injectable Supabase-like client and do not connect to Supabase.
- [x] Tests fail before implementation and pass after the adapter contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not install or initialize `@supabase/supabase-js`.
- Do not connect to a local or remote Supabase project.
- Do not run migrations.
- Do not implement UI.
- Do not put service-role secrets in client-executed code.

## 4. Completion Notes

- Added `createSupabasePetRepositories` with injectable `SupabaseClientLike`.
- Added Worker-side Supabase repository adapters for pet draft create, update, media loading, publish context loading and publish persistence.
- The adapter maps snake_case Supabase rows to existing domain/database contracts.
- Adapter failures throw sanitized `SupabasePetRepositoryError` messages without exposing service-role keys, R2 secrets or bearer tokens.
- No Supabase SDK was installed, no client was initialized and no network/database call was executed.
