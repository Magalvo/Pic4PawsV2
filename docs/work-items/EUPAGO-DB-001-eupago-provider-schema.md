---
id: EUPAGO-DB-001
title: Eupago provider — schema additions
status: done
pr: 277
merged: 2026-06-28
---

# Work-Item: EUPAGO-DB-001 â€” Eupago Provider Schema Additions

## 1. Context & Problem

`DONATE-TIER-DB-001` (merged) added `shelter_payment_configs` with two nullable
placeholder columns â€” `provider paymentProviderEnum` and `apiKeyEncrypted text` â€” reserved
for Phase 2 automated payments. `IFTHENPAY-WEBHOOK-001` (merged) wired Ifthenpay webhook
validation using a global env var (`IFTHENPAY_WEBHOOK_SECRET`).

Adding Eupago as a second supported provider requires:

1. A first-class `active_provider` column with a narrowed enum (`ifthenpay | eupago`) so
   each shelter explicitly opts into one PSP.
2. Provider-specific credential columns for both Eupago and Ifthenpay so credentials
   are per-shelter (not global env vars), enabling multi-provider operation across shelters.
3. A new domain type `ActivePaymentProvider` exported from `@pic4paws/domain`.

The existing placeholder columns (`provider`, `apiKeyEncrypted`, `webhookSecretEncrypted`,
`webhookUrlPath`) remain in place â€” they are nullable and unused. New named columns are
added alongside them; the placeholders are documented as superseded.

## Goal

Add a `shelter_active_provider` Postgres enum and four new columns to
`shelter_payment_configs`; export `ActivePaymentProvider` from `@pic4paws/domain`.

## States

Schema-only migration â€” no new request/response states. Downstream work items
(`EUPAGO-CONFIG-WORKER-001`, `EUPAGO-REFERENCE-FACTORY-001`, `EUPAGO-WEBHOOK-001`)
introduce state changes.

## Acceptance Criteria

- [ ] Add `ActivePaymentProvider = 'ifthenpay' | 'eupago'` to `packages/domain/src/index.ts`
  and export it from `packages/domain/src/index.ts`.

- [ ] Add migration artifact `0008_eupago_provider` to
  `packages/database/src/migration-artifacts.ts`:

  ```sql
  -- New enum for per-shelter provider selection
  CREATE TYPE public.shelter_active_provider AS ENUM ('ifthenpay', 'eupago');

  -- active_provider: which PSP the shelter has activated for automated payments.
  -- NULL = no automated provider configured (manual tier only).
  ALTER TABLE public.shelter_payment_configs
    ADD COLUMN active_provider public.shelter_active_provider;

  -- Eupago credentials (encrypted at rest via application-layer AES-256-GCM).
  ALTER TABLE public.shelter_payment_configs
    ADD COLUMN eupago_api_key_encrypted text;

  ALTER TABLE public.shelter_payment_configs
    ADD COLUMN eupago_webhook_secret_encrypted text;

  -- Ifthenpay per-shelter anti-phishing key (replaces global IFTHENPAY_WEBHOOK_SECRET
  -- once all shelters are migrated; kept non-nullable-safe by leaving nullable).
  ALTER TABLE public.shelter_payment_configs
    ADD COLUMN ifthenpay_anti_phishing_key text;
  ```

- [ ] Update `packages/database/src/schema.ts`:
  - Add `shelterActiveProviderEnum = pgEnum('shelter_active_provider', ['ifthenpay', 'eupago'])`.
  - Add four columns to `shelterPaymentConfigs` Drizzle table definition:
    - `activeProvider: shelterActiveProviderEnum('active_provider')`  (nullable)
    - `eupagoApiKeyEncrypted: text('eupago_api_key_encrypted')` (nullable)
    - `eupagoWebhookSecretEncrypted: text('eupago_webhook_secret_encrypted')` (nullable)
    - `ifthenpayAntiPhishingKey: text('ifthenpay_anti_phishing_key')` (nullable)

- [ ] `assertNonDestructiveMigration` passes for migration 0008 (no DROP/TRUNCATE/DELETE).

- [ ] No existing test breaks (additive only).

- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- `eupago_api_key_encrypted` and `eupago_webhook_secret_encrypted` must be encrypted
  before insert and decrypted only within the Worker at request time. The application layer
  uses AES-256-GCM; the encryption key comes from a `ENCRYPTION_SECRET` env var (never
  stored in the DB).
- `ifthenpay_anti_phishing_key` is an opaque string provided by Ifthenpay â€” it is not a
  secret in the cryptographic sense but must not be returned in API responses to clients.
- The existing `apiKeyEncrypted` and `webhookSecretEncrypted` placeholder columns are
  superseded by the provider-specific columns above. They remain in the schema as nullable
  no-ops; no code should read or write them going forward.

## 4. Non-Goals

- Do not modify any worker route or client. Schema only.
- Do not migrate existing `IFTHENPAY_WEBHOOK_SECRET` env var to per-shelter rows.
  (Migration of existing shelters is handled in `EUPAGO-CONFIG-WORKER-001`.)
- Do not encrypt existing rows (none exist in automated-tier yet).

## Affected Files

- `packages/domain/src/index.ts`
- `packages/database/src/schema.ts`
- `packages/database/src/migration-artifacts.ts`
