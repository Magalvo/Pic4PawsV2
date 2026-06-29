---
id: IFTHENPAY-KEYS-001
title: Separate Ifthenpay MB KEY and MBWAY KEY credentials
status: done
---

# Work-Item: IFTHENPAY-KEYS-001 — Separate Ifthenpay MB KEY and MBWAY KEY

## Context & Problem

Ifthenpay issues two distinct API credentials per account:
- **MB KEY** — authenticates calls to the Multibanco endpoint (`/ifthenpay/multibanco`)
- **MBWAY KEY** — authenticates calls to the MB Way endpoint (`/spg/payment/mbway`)

The current implementation (`apps/workers/src/ifthenpay-reference-adapter.ts`) accepts a
single `apiKey` field and uses it for both endpoints. This will silently fail in production:
whichever key is stored, one method will be rejected by the PSP. The env config
(`IFTHENPAY_API_KEY`) and the Supabase-backed factory
(`payment-reference-factory-supabase.ts`) both carry this single-key assumption.

Additionally, `payment-reference-factory-supabase.ts` references a non-existent
`api_key_encrypted` column — that column was never added in any migration. The Eupago path
added `eupago_api_key_encrypted`; the Ifthenpay path needs its own distinct columns.

## Goal

Split the Ifthenpay credential into two required fields throughout the stack:
- `IFTHENPAY_MB_KEY` env var (Multibanco)
- `IFTHENPAY_MBWAY_KEY` env var (MB Way)

Add the corresponding encrypted columns to `shelter_payment_configs` and wire them through
the Supabase-backed factory.

## States

No new ViewModel states. This is a credential-plumbing change only.

## Contract

### Adapter (`apps/workers/src/ifthenpay-reference-adapter.ts`)
- `CreateIfthenpayReferenceAdapterInput.apiKey: string` → `mbKey: string; mbWayKey: string`
- Multibanco call uses `mbKey` in the Authorization header
- MB Way call uses `mbWayKey` in the Authorization header

### Env config (`packages/config/src/env.ts`)
- Remove `IFTHENPAY_API_KEY` env var
- Add `IFTHENPAY_MB_KEY: optionalSecret` + `IFTHENPAY_MBWAY_KEY: optionalSecret`
- `superRefine` validation: both keys required when `PAYMENT_PRIMARY_PROVIDER === 'ifthenpay'`
- `EnvironmentConfig.payments.ifthenpayApiKey: string | null` →
  `ifthenpayMbKey: string | null` + `ifthenpayMbWayKey: string | null`
- `parseEnvironmentConfig` and `redactEnvironmentConfig` updated accordingly

### DB migration (`supabase/migrations/0010_ifthenpay_keys.sql`)
- Add `ifthenpay_mb_key_encrypted text` to `shelter_payment_configs`
- Add `ifthenpay_mbway_key_encrypted text` to `shelter_payment_configs`

### Supabase factory (`apps/workers/src/payment-reference-factory-supabase.ts`)
- Remove stale `api_key_encrypted` column reference (never existed in schema)
- Select `ifthenpay_mb_key_encrypted` + `ifthenpay_mbway_key_encrypted`
- Decrypt both; pass `{ mbKey, mbWayKey }` to `createIfthenpayReferenceAdapter`
- Return `NOT_CONFIGURED` if either column is missing

### `.env.example`
- `IFTHENPAY_API_KEY=` → `IFTHENPAY_MB_KEY=` + `IFTHENPAY_MBWAY_KEY=`

## Acceptance Criteria

- [ ] `CreateIfthenpayReferenceAdapterInput` has `mbKey` + `mbWayKey` (no `apiKey`)
- [ ] Adapter uses `mbKey` for Multibanco, `mbWayKey` for MB Way
- [ ] Env schema: `IFTHENPAY_MB_KEY` + `IFTHENPAY_MBWAY_KEY`; both required when provider is `ifthenpay`
- [ ] `EnvironmentConfig.payments` has `ifthenpayMbKey` + `ifthenpayMbWayKey`
- [ ] Migration 0010 adds both encrypted columns
- [ ] Supabase factory reads + decrypts both; no reference to `api_key_encrypted`
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` pass with no regressions

## Non-Goals

- Do not change the Ifthenpay webhook verifier (`ifthenpay-verifier.ts`) — it uses a separate
  anti-phishing key (`IFTHENPAY_WEBHOOK_SECRET`) which is already correctly modelled.
- Do not implement DB-level credential encryption read/write UI.
- Do not change any Eupago or Stripe wiring.

## Completion Notes

- `CreateIfthenpayReferenceAdapterInput`: replaced `apiKey` with `mbKey` + `mbWayKey`.
- Adapter passes `mbKey` to `/ifthenpay/multibanco` and `mbWayKey` to `/spg/payment/mbway`.
- Config: `IFTHENPAY_API_KEY` → `IFTHENPAY_MB_KEY` + `IFTHENPAY_MBWAY_KEY`; both required
  when provider is `ifthenpay`. `EnvironmentConfig.payments.ifthenpayApiKey` → two fields.
- Drizzle schema: added `ifthenpayMbKeyEncrypted` + `ifthenpayMbWayKeyEncrypted`.
- DB migration 0010: adds `ifthenpay_mb_key_encrypted` + `ifthenpay_mbway_key_encrypted`.
- Supabase factory: removed stale `api_key_encrypted` reference (never existed in DB);
  reads + decrypts both new columns; fails closed if either is missing.
- Factory test expanded: now asserts Multibanco uses `mbKey` and MB Way uses `mbWayKey`.
- 8 test files updated; 2548 tests pass (up from 2546 — two new Ifthenpay dispatch tests).

## Affected Files

- `docs/work-items/IFTHENPAY-KEYS-001-separate-mb-key-and-mbway-key.md`
- `apps/workers/src/ifthenpay-reference-adapter.ts`
- `apps/workers/src/payment-reference-factory-supabase.ts`
- `packages/config/src/env.ts`
- `supabase/migrations/0010_ifthenpay_keys.sql`
- `.env.example`
- `tests/workers/worker-boundary.test.ts`
- `tests/workers/worker-ifthenpay-composition.test.ts`
- `tests/workers/eupago-webhook-composition.test.ts`
- `tests/config/environment-contracts.test.ts`
- `tests/workers/worker-supabase-wiring.test.ts`
- `tests/workers/r2-signer-factory.test.ts`
