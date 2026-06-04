# Work-Item: DB-001-Core Schema and RLS

## 1. Context & Problem

The approved architecture and SDD require Supabase Postgres as the system of record, with Drizzle-owned schema definitions and database-level tenant boundaries. The current database package is only a placeholder, so product features cannot safely proceed until the core tables and RLS policy contracts exist.

This task establishes the first database contract for users, shelters, pets, adoption applications, donations, media, webhook events and audit events. It should not connect to a live Supabase project or run destructive migrations.

## 2. Acceptance Criteria

- [x] `packages/database` exposes Drizzle schema definitions for the approved core entities.
- [x] Personal adoption data is modeled separately from public pet/feed data.
- [x] Financial/payment tables store integer cents, provider identifiers and webhook event IDs needed for idempotency.
- [x] RLS policy definitions exist for anonymous public reads, adopter-owned applications, shelter membership access and admin oversight.
- [x] Tests fail before implementation and pass after the schema and policy contracts are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect Supabase.
- Do not create or apply real database migrations.
- Do not store secrets or provider credentials.
- Do not implement application API routes, auth flows or payment webhook handlers.

## 4. Completion Notes

- Added contract-first Drizzle schema definitions for the approved core database entities.
- Added RLS policy metadata for public published pet reads, adopter-owned adoption reads, shelter-member reads and admin oversight.
- No live Supabase connection, migration execution or destructive database action was performed.
- `npm run typecheck` required elevated execution because the Windows sandbox blocked Node path resolution with `EPERM`.
