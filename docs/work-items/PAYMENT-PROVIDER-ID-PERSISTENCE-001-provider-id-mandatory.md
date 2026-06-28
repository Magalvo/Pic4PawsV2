---
id: PAYMENT-PROVIDER-ID-PERSISTENCE-001
title: Block 201 until provider payment ID is durably stored
status: done
depends-on: PAYMENT-METHOD-PROPAGATION-001
pr: 291
merged: 2026-06-28
---

# Work-Item: PAYMENT-PROVIDER-ID-PERSISTENCE-001 — Provider ID Persistence

## 1. Context & Problem

After a successful PSP reference call, `handleWorkerDonationRequest` used optional chaining
(`setProviderPaymentId?.()`) and swallowed the failure in `.catch()`, then returned
`201 donation_created` with the usable reference regardless. If the persistence write
failed or was not configured, the donor received a valid payment reference but the local
record had no provider ID — making it impossible for the incoming webhook to resolve the
donation.

## Goal

Block the 201 response until `setProviderPaymentId` has successfully written the provider
ID to the database. Return 502 if the method is absent or throws; always call
`failDonation` before returning so the stranded row is not left as `pending_payment`.

## States

No new ViewModel states. The client already handles 502 `payment_reference_failed` as a
failed state; no UI changes required.

## Acceptance Criteria

- [x] `apps/workers/src/donation.ts`:
  - Check `donationRepository.setProviderPaymentId` is defined; if absent → `failDonation` + 502
  - Wrap the call in `try/catch`; on throw → `failDonation` + 502
  - 201 is only returned after the `await` resolves successfully
- [x] `tests/workers/donation.test.ts`:
  - New test: factory ok:true + `setProviderPaymentId` absent → 502, `failDonation` called
  - New test: factory ok:true + `setProviderPaymentId` throws → 502, `failDonation` called
  - Existing "factory ok:true → 201" test unchanged (passes `setProviderPaymentId` mock)
- [x] All four gates pass: typecheck, lint, test, build

## Affected Files

- `apps/workers/src/donation.ts`
- `tests/workers/donation.test.ts`
