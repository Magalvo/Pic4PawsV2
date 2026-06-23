# Work-Item: WEB-DONATE-REVIEW-001 — Web Shelter Donation Review UI

status: done

## Goal

Create the web shelter donation review page at `/abrigos/[shelterId]/doacoes/[donationId]`.
Mirror of `MOBILE-DONATE-REVIEW-001`. Shelter volunteers see donation details and the donor's
receipt, then approve or reject the donation.

## States

- `null` (local) — loading.
- `idle` — donation details + receipt image + Aprovar/Rejeitar buttons.
- `approving` — approve request in flight.
- `rejecting` — reject request in flight.
- `approved` — confirmation that donation is now `paid`.
- `rejected` — confirmation that donation is `rejected`.
- `failed` — error with retry.
- `forbidden` — actor is not a shelter member.
- `wrong_state` — donation not in `pending_review`.

## Contract

Create `apps/web/src/donation-review.ts`:
- `WebDonationReviewUiContent` + `webDonationReviewUiContent` (locale `pt-PT`).
- Same state types as the mobile module.
- `createWebDonationReviewUi({ donationStatusClient, reviewDonationClient })`.

Create `apps/web/app/abrigos/[shelterId]/doacoes/[donationId]/page.tsx`:
- `'use client'` at top.
- `use(params)` for `shelterId` and `donationId`.
- `useEffect` on mount: load donation.
- Display receipt image from the `receiptMediaId` using the R2 public URL.
- Buttons: "Aprovar" and "Rejeitar"; each triggers a confirmation dialog before calling
  the UI action.
- `workerUrl()` from `../../../../../../src/env`.
- All copy in PT-PT.

Tests in `tests/web/donation-review-ui.test.ts`. Final validation must pass.

## Affected Files

- `apps/web/src/donation-review.ts`
- `apps/web/app/abrigos/[shelterId]/doacoes/[donationId]/page.tsx`
- `tests/web/donation-review-ui.test.ts`

## Completion Notes

Pending implementation.
