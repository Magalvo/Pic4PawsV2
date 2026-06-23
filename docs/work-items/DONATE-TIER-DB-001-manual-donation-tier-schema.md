# Work-Item: DONATE-TIER-DB-001 — Manual Donation Tier Schema

status: done

## 1. Context & Problem

The current schema gates all donations behind `payment_account_status = 'active'` on the
`shelters` table, but there is no concept of *how* a shelter receives money. The only tier
supported is an automated gateway (Ifthenpay/Eupago), which requires API keys that most
shelter volunteers cannot set up on day 1.

This task introduces a first-class **manual tier** — shelters provide an IBAN and optional
MB WAY phone number; donors make a bank transfer and upload proof; a volunteer approves.
The schema must also reserve space for the future automated tier (Phase 2) without blocking
Phase 1 delivery.

All schema changes are non-destructive (additive only). The existing payment flow continues
to work unchanged.

## Goal

Add the `shelter_payment_tier` enum, the `shelter_payment_configs` table, the three new
`donation_status` values (`pending_receipt`, `pending_review`, `rejected`), three new
columns on `donation_transactions`, and a Drizzle-compatible migration artifact (0007).

## States

- `pending_receipt`: donation created under manual tier, donor has not yet uploaded proof.
- `pending_review`: receipt linked, awaiting shelter volunteer approval.
- `rejected`: shelter volunteer rejected the receipt (terminal).
- The existing statuses (`created`, `pending_payment`, `paid`, etc.) remain unchanged.

## Acceptance Criteria

- [x] Add `shelterPaymentTierEnum` = `pgEnum('shelter_payment_tier', ['manual', 'automated'])`
  to `packages/database/src/schema.ts`.
- [x] Add `shelterPaymentConfigs` table to `packages/database/src/schema.ts` with:
  - `id` (uuid PK), `shelterId` (FK → shelters.id), `tier` (shelterPaymentTierEnum, not null, default `'manual'`).
  - Manual tier: `iban text`, `mbWayPhone text` (both nullable).
  - Phase 2 placeholder (nullable, not used in Phase 1): `provider paymentProviderEnum`,
    `apiKeyEncrypted text`, `webhookSecretEncrypted text`, `webhookUrlPath text`.
  - `status paymentAccountStatusEnum` (not null, default `'not_configured'`).
  - Standard `auditColumns` (`createdAt`, `updatedAt`, `deletedAt`).
  - Unique index on `shelter_id`.
- [x] Extend `donationStatusEnum` in `schema.ts` to include `'pending_receipt'`,
  `'pending_review'`, `'rejected'` (order: after `'created'`, before `'pending_payment'`).
- [x] Add nullable columns to `donationTransactions` in `schema.ts`:
  `receiptMediaId uuid` (FK → `mediaAssets.id`), `reviewedByUserId uuid` (FK → `users.id`),
  `reviewedAt timestamptz`.
- [x] Update `DonationStatus` in `packages/payments/src/donations.ts` to include the three new values.
- [x] Add migration artifact `0007_manual_donation_tier` to
  `packages/database/src/migration-artifacts.ts`:
  - `ALTER TYPE public.donation_status ADD VALUE 'pending_receipt' BEFORE 'pending_payment'`
  - `ALTER TYPE public.donation_status ADD VALUE 'pending_review' AFTER 'pending_receipt'`
  - `ALTER TYPE public.donation_status ADD VALUE 'rejected' AFTER 'pending_review'`
  - `CREATE TYPE public.shelter_payment_tier AS ENUM ('manual', 'automated')`
  - `CREATE TABLE public.shelter_payment_configs (...)` with all columns above and a
    `UNIQUE (shelter_id)` constraint.
  - `ALTER TABLE public.donation_transactions ADD COLUMN receipt_media_id uuid REFERENCES public.media_assets(id)`
  - `ALTER TABLE public.donation_transactions ADD COLUMN reviewed_by_user_id uuid REFERENCES public.users(id)`
  - `ALTER TABLE public.donation_transactions ADD COLUMN reviewed_at timestamptz`
- [x] `assertNonDestructiveMigration` passes for migration 0007 (no DROP/TRUNCATE/DELETE).
- [x] No existing test breaks (additive schema only).
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Implementation Note — PostgreSQL Enum Caveat

`ALTER TYPE ... ADD VALUE` cannot run inside an explicit transaction in PostgreSQL. The
migration SQL for the three new donation statuses must be written as three separate
statements **without** wrapping them in `BEGIN/COMMIT`. The migration artifact must document
this constraint.

## 4. Non-Goals

- Do not add RLS policies for `shelter_payment_configs` (added in DONATE-CONFIG-WORKER-001).
- Do not modify any existing worker route or client.
- Do not implement Phase 2 automated-tier columns beyond placeholder nullables.

## Affected files

- `packages/database/src/schema.ts`
- `packages/database/src/migration-artifacts.ts`
- `packages/payments/src/donations.ts`

## Completion Notes

- `shelterPaymentTierEnum` and `shelterPaymentConfigs` added to `schema.ts`; Phase 2 provider columns present as nullable placeholders.
- `donationStatusEnum` extended with `pending_receipt`, `pending_review`, `rejected` — ordered before `pending_payment` to match the manual tier lifecycle.
- `DonationStatus` type union in `packages/payments/src/donations.ts` updated to match.
- Migration 0007 SQL uses bare `ALTER TYPE ... ADD VALUE` statements (no `BEGIN`/`COMMIT`) to satisfy the PostgreSQL constraint on enum mutations outside explicit transactions.
- All 2252 tests pass; no existing behaviour changed.
