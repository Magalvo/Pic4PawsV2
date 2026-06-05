# Work-Item: MIGRATIONS-001-Initial Schema and RLS Artifacts

## 1. Context & Problem

`DB-001` defined the Drizzle schema contract and `RLS-001` made RLS SQL renderable. The project still needs migration-ready artifacts that combine the approved schema and RLS contracts into deterministic SQL for review before any Supabase database is touched.

## 2. Acceptance Criteria

- [x] A deterministic initial migration artifact exists with an ordered filename and reviewable SQL.
- [x] The artifact creates the approved enum types and core tables for users, shelters, memberships, media, pets, adoption applications, donations, sponsorships, webhook events and audit events.
- [x] The artifact includes unique constraints and foreign keys needed by the approved contracts.
- [x] The artifact appends generated RLS SQL from the existing RLS renderer.
- [x] The artifact is marked as non-destructive and rejects table/schema/data deletion SQL.
- [x] Tests fail before implementation and pass after migration artifacts are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not apply migrations.
- Do not connect to Supabase.
- Do not delete schemas, tables or volumes.
- Do not introduce environment-specific Supabase credentials.

## 4. Completion Notes

- Added a deterministic initial migration artifact for the approved core schema and RLS policy SQL.
- Included enum creation, core tables, foreign keys, unique constraints and generated RLS statements in a reviewable SQL renderer.
- Added a non-destructive safety guard that rejects table/schema/database drops, truncation, data deletion and column drops.
- No Supabase connection was made and no migration was applied.
