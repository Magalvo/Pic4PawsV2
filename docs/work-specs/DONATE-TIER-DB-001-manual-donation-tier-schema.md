# Work-Spec: Implementation Plan for DONATE-TIER-DB-001

## 1. Target Files

- `docs/work-items/DONATE-TIER-DB-001-manual-donation-tier-schema.md`
- `docs/work-specs/DONATE-TIER-DB-001-manual-donation-tier-schema.md`
- `packages/database/src/schema.ts`
- `packages/database/src/migration-artifacts.ts`
- `packages/payments/src/donations.ts`

## 2. Proposed Technical Approach

### Schema changes (`packages/database/src/schema.ts`)

1. Add `shelterPaymentTierEnum` immediately after `paymentAccountStatusEnum` (line ~50).

2. Add `shelterPaymentConfigs` table between `shelterMemberships` and `mediaAssets`.
   The unique index `shelter_payment_configs_shelter_id_unique` on `shelter_id` enforces
   one config record per shelter. Phase 2 columns (`apiKeyEncrypted`, etc.) are typed as
   `text` and remain nullable — no special handling needed at this stage.

3. Extend `donationStatusEnum` values in-place. Because Drizzle generates the enum from
   the TypeScript array, order matters for SQL generation but not for runtime type-safety.
   Insert the three new values between `'created'` and `'pending_payment'` so the enum
   ordering reflects the natural state progression.

4. Add three nullable columns to `donationTransactions`. Because these are all FKs to
   existing tables, Drizzle will reference the already-defined Drizzle table objects.

### Domain type update (`packages/payments/src/donations.ts`)

Extend `DonationStatus` union to add `'pending_receipt' | 'pending_review' | 'rejected'`.
The `PaymentWebhookStatus` type in `webhooks.ts` is a `Extract<DonationStatus, ...>` and
does not need to change — webhook events never transition to the new manual statuses.

### Migration artifact (`packages/database/src/migration-artifacts.ts`)

Add `manualDonationTierMigration` constant and append it to `migrationArtifacts`.

Key constraint: PostgreSQL does not allow `ALTER TYPE ... ADD VALUE` inside a transaction.
Write the three ADD VALUE statements without BEGIN/COMMIT wrapping. The `renderMigrationArtifact`
helper prepends the artifact id/description comment automatically — ensure the SQL body
does not add its own transaction wrapper.

The CREATE TABLE for `shelter_payment_configs` must be written after the new
`shelter_payment_tier` type exists, so order within the migration SQL matters.

## 3. Testing Strategy

No new unit tests are required for this work item — schema and migration files are
structural and validated by the TypeScript compiler and the existing migration hygiene tests.

Regression check:
- `packages/payments` unit tests (`tests/payments/`) must continue to pass unchanged.
- `assertNonDestructiveMigration` must not throw for the new artifact.
- `npm run typecheck` will catch any type errors introduced by the new status values.

## 4. Validation Commands

```
npx tsc --noEmit -p tests/tsconfig.json
npm run typecheck
npm run lint
npm run test
npm run build
```

## 5. Risk Controls

- All changes are additive. Existing `NOT NULL` constraints on `donation_transactions` are
  unaffected because the three new columns are nullable.
- The existing `donationStatusEnum` values are not renamed or removed — only new values are
  added. No existing switch statements or conditional checks break.
- Phase 2 columns on `shelter_payment_configs` are deliberately nullable and undocumented
  beyond the schema comment; they must not be read or written by any Phase 1 code path.
