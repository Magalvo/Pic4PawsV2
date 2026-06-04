# Work-Item: SUPABASE-001-Local Config and Migration Dry Run

## 1. Context & Problem

`MIGRATIONS-001` created reviewable SQL artifacts for the approved schema and RLS policies. The project still needs a local Supabase configuration and a safe dry-run plan so future database validation can happen against local/disposable environments before any production project is linked or changed.

## 2. Acceptance Criteria

- [x] A local-only Supabase config exists under `supabase/config.toml`.
- [x] The config contains local ports and redirect URLs but no secrets, access tokens or service-role keys.
- [x] Database helpers map approved migration artifacts to `supabase/migrations/*.sql` paths.
- [x] A dry-run plan exists for reviewing and validating migrations locally without remote project commands.
- [x] The dry-run plan rejects production-risk commands such as `supabase link`, `supabase db push`, project refs and access tokens.
- [x] Tests fail before implementation and pass after the Supabase local contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not install or run the Supabase CLI.
- Do not connect to Supabase.
- Do not apply migrations to any remote database.
- Do not add Supabase secrets to the repository.

## 4. Completion Notes

- Added local-only Supabase configuration under `supabase/config.toml`.
- Added Supabase local guidance that explicitly blocks project linking, `db push`, project refs and access-token based flows for this phase.
- Added typed database helpers for mapping approved migration artifacts to `supabase/migrations/*.sql` paths.
- No Supabase CLI command was executed, no project was linked and no migration was applied.
