---
id: SERVICE-ROLE-GRANTS-001
title: Add migration granting service_role access to all public tables
status: done
---

# Work-Item: SERVICE-ROLE-GRANTS-001 — Service Role Grants Migration

## Context & Problem

Local Supabase does not automatically grant `service_role` table privileges the way hosted
Supabase (supabase.com) does. Every Worker query against the local database returned
`permission denied (42501)`, making the full local dev stack non-functional even after the
dispatch fix in LOCAL-DEV-WIRING-001.

## Goal

Add a migration that backfills `GRANT ALL` on all existing `public` schema tables and
sequences for the `service_role` role, and sets `ALTER DEFAULT PRIVILEGES` so future
migrations automatically inherit the same grants.

## States

No new ViewModel states. Database-only change.

## Contract

- `supabase/migrations/0011_service_role_grants.sql` — new migration granting
  `ALL PRIVILEGES` on all `public` tables and sequences to `service_role`, plus
  `ALTER DEFAULT PRIVILEGES` for future objects.
- `packages/database/src/migration-artifacts.ts` — registers the new artifact.
- `tests/database/migration-artifacts.test.ts` — asserts the artifact is listed.

## Acceptance Criteria

- [x] Migration `0011_service_role_grants.sql` grants `ALL` on all existing public tables to `service_role`.
- [x] `ALTER DEFAULT PRIVILEGES` set so future migrations inherit the same grants.
- [x] Artifact registered in `packages/database/src/migration-artifacts.ts`.
- [x] Test added in `tests/database/migration-artifacts.test.ts`.
- [x] All existing tests pass.

## Non-Goals

- Do not add or remove application tables.
- Do not change RLS policies.
- Do not alter hosted Supabase configuration.

## Affected Files

- `docs/work-items/SERVICE-ROLE-GRANTS-001-service-role-migration.md` (this file)
- `supabase/migrations/0011_service_role_grants.sql`
- `packages/database/src/migration-artifacts.ts`
- `tests/database/migration-artifacts.test.ts`

## Completion Notes

Implemented in PR #301 (`agent/SERVICE-ROLE-GRANTS-001`), merged 2026-06-29.
Discovered during LOCAL-DEV-WIRING-001 local dev session.
