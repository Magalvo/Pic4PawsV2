# Work-Item: RLS-001-Migration-Ready Policy SQL

## 1. Context & Problem

`DB-001` defined RLS policy metadata for public reads, adopter-owned adoption applications, shelter-member access and admin oversight. The metadata is useful for tests, but Supabase/Postgres migrations require concrete SQL statements. Before applying any database migrations, the project needs deterministic SQL generation that can be reviewed, tested and later copied into migration files.

## 2. Acceptance Criteria

- [x] RLS SQL generation emits `alter table ... enable row level security` for every protected table.
- [x] RLS SQL generation emits deterministic `drop policy if exists` and `create policy` statements.
- [x] Policy SQL includes command, role, `using` and optional `with check` clauses.
- [x] The wildcard admin policy expands to all approved core RLS tables instead of creating SQL for `*`.
- [x] Generated SQL includes the existing public pet, adoption application, donation transaction and admin policies.
- [x] Tests fail before implementation and pass after migration-ready SQL generation is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not apply migrations.
- Do not connect to Supabase.
- Do not modify live schemas, tables or volumes.
- Do not implement policy simulation against a real database.

## 4. Completion Notes

- Added deterministic SQL rendering for RLS metadata, including `enable row level security`, `drop policy if exists` and `create policy`.
- Expanded wildcard admin policy metadata across the approved protected core tables.
- No Supabase connection or migration execution was performed.
- Full validation passed with Node `22.22.3`.
