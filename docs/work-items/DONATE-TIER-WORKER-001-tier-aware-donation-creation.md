# Work-Item: DONATE-TIER-WORKER-001 — Tier-Aware Donation Creation

status: done

## 1. Context & Problem

`DONATE-CONFIG-WORKER-001` (merged) enables shelters to save a manual payment config and
activates their `payment_account_status`. `DONATION-WORKER-001` (done) handles `POST /donations`
but creates all transactions with `status: 'created'` and a random UUID as
`providerPaymentId`, returning no payment instructions to the donor.

Donors using manual-tier shelters currently receive no IBAN/phone information after
submitting a donation — they have no way to make the transfer. This task makes `POST /donations`
tier-aware: it reads the shelter's payment config and returns the IBAN and MB WAY phone
(if configured) in the response, setting the initial donation status to `pending_receipt`
for manual-tier shelters.

## Goal

Extend `POST /donations` so that:
1. The eligibility context query also fetches the shelter's `shelter_payment_configs` row.
2. Donations to manual-tier shelters are created with `status: 'pending_receipt'`.
3. The 201 response includes `tier`, `iban`, and `mbWayPhone` for the donor to act on.
4. The existing automated-tier path (future Phase 2) is reserved as a no-op branch.

## States

Unchanged from `DONATION-WORKER-001`; only the `donation_created` response body grows:
- `donation_created`: includes `tier: 'manual'`, `iban`, `mbWayPhone` for manual-tier shelters.

## Acceptance Criteria

- [x] Extend `DonationEligibilityContext` in `apps/workers/src/donation.ts` with:
  ```ts
  paymentConfig: {
    tier: 'manual' | 'automated';
    iban: string | null;
    mbWayPhone: string | null;
  } | null;
  ```
- [x] Extend `validateDonationEligibility` to reject with `payment_config_not_found` when
  `context.paymentConfig` is null (i.e. shelter is `active` but has no config row — data
  inconsistency guard).
- [x] Extend `getDonationEligibilityContext` in `apps/workers/src/donation-supabase.ts` to
  JOIN or secondary-SELECT `shelter_payment_configs` by `shelter_id`.
- [x] Extend `CreateDonationInput` and `createDonation` in `donation-supabase.ts` to accept
  `initialStatus: 'pending_receipt' | 'pending_payment'`; use it for the `status` column.
- [x] Update `handleWorkerDonationRequest` in `donation.ts`:
  - Derive `initialStatus` from `eligibilityContext.paymentConfig.tier`:
    - `'manual'` → `'pending_receipt'`
    - `'automated'` → 501 `not_implemented` (Phase 1 stub — must not silently succeed)
  - Return `tier`, `iban`, `mbWayPhone` in the 201 response body.
- [x] Update `DonationClientSuccess` in `packages/client/src/donations.ts`:
  - Add `tier: 'manual' | 'automated'`.
  - Add `iban: string | null` and `mbWayPhone: string | null` (present for manual tier).
  - Update `parseDonationSuccess` to parse these new fields.
- [x] Extend existing tests in `tests/workers/donation.test.ts` to cover:
  - Manual-tier eligibility context returns `pending_receipt` initial status.
  - 201 response includes `tier`, `iban`, `mbWayPhone` for manual tier.
  - `payment_config_not_found` rejection when config is missing.
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- The `iban` and `mbWayPhone` returned in the response are the shelter's public payment
  details — they are safe to include in the 201 response body.
- `donorUserId` is still derived exclusively from the authenticated actor. No change here.
- The automated-tier branch must be left as a stub that returns `501 not_implemented` for
  the duration of Phase 1 — it must never silently succeed.

## 4. Non-Goals

- Do not call Ifthenpay or Eupago APIs (Phase 2).
- Do not implement receipt upload or manual review (see `DONATE-MANUAL-WORKER-001`).
- Do not change the path or method of `POST /donations`.

## Affected files

- `apps/workers/src/donation.ts`
- `apps/workers/src/donation-supabase.ts`
- `packages/client/src/donations.ts`
- `tests/workers/donation.test.ts`
- `tests/workers/donation-supabase-repository.test.ts`

## Completion Notes

Extended `DonationEligibilityContext` with `paymentConfig` and added a secondary SELECT from `shelter_payment_configs` in `getDonationEligibilityContext`. The automated-tier path returns `501 not_implemented` (Phase 1 stub). Manual-tier donations are created with `initialStatus: 'pending_receipt'` and the 201 response includes `tier`, `iban`, `mbWayPhone` for the donor to act on. `DonationClientSuccess` updated with the three new fields; all downstream test fixtures (mobile and web) updated accordingly. 2291 tests, full pipeline green.
