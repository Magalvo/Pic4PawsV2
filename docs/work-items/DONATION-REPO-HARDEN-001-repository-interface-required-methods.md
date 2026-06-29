---
id: DONATION-REPO-HARDEN-001
title: Harden DonationRepository interface — make persistence methods required
status: done
---

# Work-Item: DONATION-REPO-HARDEN-001 — Repository Interface Hardening

## Context & Problem

Advisory P3 from `docs/audits/2026-06-29-sdd-audit-prs-291-294.md` found that
`DonationRepository.setProviderPaymentId` and `DonationRepository.failDonation` are still
declared optional (`?:`) in `apps/workers/src/donation.ts`. The `PAYMENT-PROVIDER-ID-PERSISTENCE-001`
work item added a runtime guard (`if (!donationRepository.setProviderPaymentId)`) and optional
chaining (`failDonation?.()`) to handle the absent-method case at runtime.

However, the Supabase repository (`apps/workers/src/donation-supabase.ts`) already implements
both methods, so the optionality is purely a type artefact. TypeScript cannot catch a future
repository implementation that omits either method. The work item goal stated "always call
`failDonation` before returning," which the optional chaining technically violates.

## Goal

Make `setProviderPaymentId` and `failDonation` required fields of `DonationRepository`. Remove
the now-unreachable absence guard. Change optional chaining to direct calls.

## States

No new ViewModel states. This is a type-safety and internal-consistency change only.

## Contract

- `DonationRepository.setProviderPaymentId` becomes a required field (remove `?:`).
- `DonationRepository.failDonation` becomes a required field (remove `?:`).
- The `if (!donationRepository.setProviderPaymentId)` guard block is removed (unreachable once required).
- All `failDonation?.()` calls become `failDonation()` (optional chaining removed).
- The test that constructs a repository without `setProviderPaymentId` to verify the runtime-absent
  path is refactored to use `as unknown as DonationRepository` so the runtime behavior remains covered.
- All other test repositories that lack the two methods receive stub implementations.
- No behaviour change at runtime: all existing tests continue to pass.

## Acceptance Criteria

- [x] `apps/workers/src/donation.ts`:
  - `setProviderPaymentId` and `failDonation` declared without `?:` in `DonationRepository`
  - The `if (!donationRepository.setProviderPaymentId)` guard block is removed
  - All `failDonation?.()` occurrences replaced with `failDonation()`
- [x] `tests/workers/donation.test.ts`:
  - The "no setProviderPaymentId" test uses `as unknown as DonationRepository` cast
  - All inline repository objects satisfy the updated (non-optional) interface
  - `makeDonationRepo` factory includes both stub methods
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` pass with no regressions

## Non-Goals

- Do not change `DonationManualRepository` or any other repository interface.
- Do not change runtime behavior — only TypeScript types and the unreachable guard are modified.
- Do not add new test cases beyond the refactor of the absent-method test.

## Affected Files

- `docs/work-items/DONATION-REPO-HARDEN-001-repository-interface-required-methods.md`
- `apps/workers/src/donation.ts`
- `tests/workers/donation.test.ts`

## Completion Notes

- Removed `?:` from `setProviderPaymentId` and `failDonation` in `DonationRepository`
  (`apps/workers/src/donation.ts:75-76`).
- Removed the now-unreachable `if (!donationRepository.setProviderPaymentId)` guard block.
- Changed all `failDonation?.()` calls to `failDonation()` (two occurrences in the handler).
- Updated `makeDonationRepo` factory and nine inline test repositories to satisfy the updated
  non-optional interface. The "setProviderPaymentId absent" test refactored with
  `as unknown as DonationRepository` cast to preserve runtime-absent-method coverage via the
  catch block.
- All four gates passed: 280 test files, 2546 tests, typecheck, lint, build.
