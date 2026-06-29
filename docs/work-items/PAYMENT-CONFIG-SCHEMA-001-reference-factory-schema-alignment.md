---
id: PAYMENT-CONFIG-SCHEMA-001
title: Align payment reference factory with the canonical credential schema
status: done
---

# Work-Item: PAYMENT-CONFIG-SCHEMA-001 - Reference Factory Schema Alignment

## Context & Problem

Finding P1-3 in `docs/audits/2026-06-28-sdd-audit-prs-270-282.md` identified that
`createSupabasePaymentReferenceFactory` selects `ifthenpay_api_key_encrypted`, but that
column does not exist in the Drizzle schema or committed migration artifacts. PostgREST
rejects the complete projection before provider dispatch, so the phantom Ifthenpay column
also prevents valid Eupago configurations from creating references.

The canonical table currently contains `api_key_encrypted`, the original encrypted provider
credential placeholder, plus Eupago-specific credentials and
`ifthenpay_anti_phishing_key`. Current official Ifthenpay documentation distinguishes an
`MB KEY` for Multibanco, an `MBWAY KEY` for MB WAY, and the callback anti-phishing key:

- https://ifthenpay.com/docs/en/api/multibanco/
- https://ifthenpay.com/docs/en/api/mbway/
- https://ifthenpay.com/docs/en/guides/callback/

This work item must therefore remove the nonexistent column without inventing another
incorrect singular Ifthenpay credential. Method-specific credential configuration belongs
to the P1-5 remediation, together with explicit payment-method propagation.

## Goal

Make the reference factory query only columns that exist in the canonical database schema,
allow Eupago dispatch independently of unused Ifthenpay data, and preserve fail-closed legacy
Ifthenpay behavior through the existing `api_key_encrypted` placeholder until P1-5 replaces it.

## States

- `eupago_configured`: decrypt `eupago_api_key_encrypted` and dispatch to Eupago.
- `ifthenpay_legacy_configured`: decrypt `api_key_encrypted` and dispatch to the existing
  Ifthenpay adapter.
- `provider_not_configured`: missing row, provider, provider credential, decryption failure or
  Supabase error returns `{ ok: false, reason: 'invalid_response' }` without a PSP call.

## Contract

- Select exactly `active_provider,eupago_api_key_encrypted,api_key_encrypted,mb_way_phone`.
- The selected database column names must be covered by the Drizzle
  `shelterPaymentConfigs` schema.
- A null `api_key_encrypted` must not prevent the Eupago branch from executing.
- The Ifthenpay branch may read `api_key_encrypted` only as a legacy compatibility path.
- Never use `ifthenpay_anti_phishing_key` as a reference-generation credential.
- Never log, return or persist decrypted credentials.
- Do not add a migration or new singular Ifthenpay API-key column in this work item.

## Acceptance Criteria

- [x] The factory no longer references `ifthenpay_api_key_encrypted`.
- [x] Every selected column exists in the canonical Drizzle schema.
- [x] A valid Eupago row dispatches successfully when `api_key_encrypted` is null.
- [x] A legacy Ifthenpay row reads and decrypts `api_key_encrypted`.
- [x] Missing or undecryptable provider credentials fail closed without calling the PSP.
- [x] Focused tests pass.
- [x] `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` pass.
- [x] `graphify update .` is executed.

## Non-Goals

- Do not correct the external Ifthenpay reference adapter protocol here.
- Do not add MB/MB WAY method selection or donor phone propagation; those belong to P1-5.
- Do not change payment-configuration request/response contracts.
- Do not apply database changes locally or remotely.

## Affected Files

- `docs/work-items/PAYMENT-CONFIG-SCHEMA-001-reference-factory-schema-alignment.md`
- `apps/workers/src/payment-reference-factory-supabase.ts`
- `tests/workers/payment-reference-factory-supabase.test.ts`

## Completion Notes

- Replaced the nonexistent `ifthenpay_api_key_encrypted` projection and row field with the
  committed legacy column `api_key_encrypted`.
- Added a schema contract test that compares every PostgREST projection field with the
  physical column names exposed by the Drizzle table.
- Added Eupago and legacy Ifthenpay dispatch coverage plus fail-closed cases for missing and
  undecryptable credentials. Focused result: 5/5 tests.
- Full validation passed: typecheck, lint, 280 test files with 2520 tests, and 9 build tasks.
- `graphify update .` completed with 8658 nodes and 11662 edges. `graphify-out/` is ignored;
  Graphify reported 71 existing extraction warnings.
- The legacy Ifthenpay path is not production-ready. Official documentation requires distinct
  `MB KEY` and `MBWAY KEY` credentials; P1-5 must model those keys together with the selected
  payment method before activation.
