---
id: PAYMENT-CONFIG-RLS-001
title: Protect shelter payment configuration as server-only data
status: in_progress
---

# Work-Item: PAYMENT-CONFIG-RLS-001 - Server-Only Payment Configuration

## Context & Problem

The SDD audit in `docs/audits/2026-06-28-sdd-audit-prs-270-282.md` found that
`public.shelter_payment_configs` is created in the exposed `public` schema without Row
Level Security. The table contains IBAN and MB WAY contact data as well as provider
credentials. Default Data API grants can therefore expose or permit mutation of financial
configuration even though application access is intended to pass through the Worker.

The existing payment configuration routes already authenticate and authorize shelter
members in the Worker, whose repository uses the Supabase `service_role`. Direct access by
`anon` or `authenticated` is neither required nor safe. Supabase documents that tables in
exposed schemas must enable RLS and receive only the privileges required by each Postgres
role:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api

## Goal

Make `public.shelter_payment_configs` a server-only table through a non-destructive migration:
enable RLS, revoke all table privileges from `anon` and `authenticated`, define no client
policies, and retain the CRUD privileges required by `service_role`.

## States

- `client_denied`: `anon` and `authenticated` cannot select, insert, update or delete rows,
  regardless of user, role or shelter membership.
- `service_available`: the Worker repository can continue to select, insert, update and delete
  with `service_role`.
- `deny_by_default`: the table has RLS enabled and no client-facing policies.

## Contract

- Add migration artifact `0009_payment_config_rls`.
- The migration must be additive/non-destructive and idempotent for privileges and RLS state.
- Execute:
  - `ALTER TABLE public.shelter_payment_configs ENABLE ROW LEVEL SECURITY`.
  - `REVOKE ALL PRIVILEGES ... FROM anon, authenticated`.
  - `GRANT SELECT, INSERT, UPDATE, DELETE ... TO service_role`.
- Do not add owner/admin policies. Owners and admins continue to use authenticated Worker
  routes; granting direct row access would also expose credential columns.
- Record `shelter_payment_configs: []` in the RLS policy matrix to make the intentional
  no-policy state reviewable without including the table in the wildcard admin policy.
- Keep committed `supabase/migrations/*.sql` exactly aligned with every migration artifact.
  This necessarily materializes the already-approved `0006`, `0007` and `0008` files before
  adding `0009`.

## Acceptance Criteria

- [x] Migration `0009_payment_config_rls` enables RLS on `shelter_payment_configs`.
- [x] `anon` and `authenticated` have no direct table privileges.
- [x] `service_role` retains select, insert, update and delete privileges.
- [x] No client-facing RLS policy is created for the table.
- [x] The policy matrix documents the server-only, deny-by-default state.
- [x] Migration artefacts `0006` through `0009` are generated and committed.
- [x] A pgTAP policy test covers RLS state, client denial and service-role access.
- [x] Focused Vitest tests pass.
- [x] `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` pass.
- [x] `graphify update .` is executed.

## Non-Goals

- Do not rotate or re-encrypt provider credentials in this work item.
- Do not change Worker authorization or response contracts.
- Do not expose non-secret payment configuration directly through Supabase.
- Do not apply migrations to a remote Supabase project.

## Affected Files

- `docs/work-items/PAYMENT-CONFIG-RLS-001-server-only-payment-config.md`
- `packages/database/src/rls-policies.ts`
- `packages/database/src/migration-artifacts.ts`
- `tests/database/rls-sql.test.ts`
- `tests/database/migration-artifacts.test.ts`
- `tests/database/supabase-local.test.ts`
- `supabase/migrations/0006_push_tokens.sql`
- `supabase/migrations/0007_manual_donation_tier.sql`
- `supabase/migrations/0008_eupago_provider.sql`
- `supabase/migrations/0009_payment_config_rls.sql`
- `supabase/tests/0009_payment_config_rls.test.sql`
- `supabase/README.md`

## Completion Notes

- Added non-destructive migration `0009_payment_config_rls` with RLS enabled, no client
  policies, explicit revocation for `anon`/`authenticated`, and CRUD grants for `service_role`.
- Added pgTAP coverage for the RLS flag, empty policy set and each relevant role privilege.
- Regenerated and versioned migrations `0006` through `0009`; Vitest now enforces parity
  between every TypeScript migration artifact and committed SQL.
- Focused tests passed: 3 files, 24 tests. Full gates passed: typecheck, lint, 279 test files
  with 2517 tests, and 9 build tasks.
- `graphify update .` completed with 8658 nodes and 11654 edges. `graphify-out/` remains
  ignored by Git; Graphify reported 71 existing extraction warnings.
- The pgTAP file was not executed because `supabase status` did not return for the local stack.
  No reset, remote migration or volume operation was attempted.
