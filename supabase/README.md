# Supabase Local Contract

This folder is for local/disposable Supabase validation only.

No production project should be linked from this repository until a later work item explicitly approves remote environments, secrets handling and migration execution.

## Local Dry Run Shape

1. Review `supabase/config.toml`.
2. Review the generated migration path: `supabase/migrations/0001_initial_core_schema_and_rls.sql`.
3. Generate or copy SQL only from the approved `initialDatabaseMigration` artifact.
4. Use local Supabase CLI commands only, such as `supabase start` and `supabase migration list --local`.

Do not use `supabase link`, `supabase db push`, project refs or access tokens in this phase.
