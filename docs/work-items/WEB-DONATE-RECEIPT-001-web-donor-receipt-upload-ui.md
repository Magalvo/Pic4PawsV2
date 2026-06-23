# Work-Item: WEB-DONATE-RECEIPT-001 — Web Donor Receipt Upload UI

status: done

## Goal

Create the web receipt upload page at `/doacoes/[donationId]/comprovativo`. Mirror of
`MOBILE-DONATE-RECEIPT-001`. After making a bank transfer, the donor uploads a screenshot
or photo of the transaction confirmation and links it to the pending donation.

## States

- `null` (local) — loading.
- `idle` — donation details + file input shown.
- `uploading` — media upload in flight.
- `submitting` — PATCH /receipt in flight.
- `submitted` — confirmation + link back to `/doacoes/[donationId]`.
- `failed` — error with retry.
- `wrong_state` — donation not in `pending_receipt`.
- `forbidden` — actor is not the donor.

## Contract

Create `apps/web/src/donation-receipt.ts`:
- `WebDonationReceiptUiContent` + `webDonationReceiptUiContent` (locale `pt-PT`).
- Same state types as the mobile module.
- `createWebDonationReceiptUi({ donationStatusClient, mediaUploadClient, submitReceiptClient })`.

Create `apps/web/app/doacoes/[donationId]/comprovativo/page.tsx`:
- `'use client'` at top.
- `use(params)` for `donationId`.
- `useEffect` on mount: load donation status.
- File input (`<input type="file" accept="image/*">`) + submit button.
- On file select + submit: call `ui.uploadAndSubmit(donationId, file)`.
- `workerUrl()` from `../../../../src/env`.
- All copy in PT-PT.

Tests in `tests/web/donation-receipt-ui.test.ts`. Final validation must pass.

## Affected Files

- `apps/web/src/donation-receipt.ts`
- `apps/web/app/doacoes/[donationId]/comprovativo/page.tsx`
- `tests/web/donation-receipt-ui.test.ts`

## Completion Notes

Created `apps/web/src/donation-receipt.ts` with `webDonationReceiptUiContent` (pt-PT, product-flow-ready, 7 states: idle/uploading/submitting/submitted/failed/wrong_state/forbidden) and `createWebDonationReceiptUi({ donationStatusClient, mediaUploadClient, submitReceiptClient })`. `loadDonationStatus` checks `pending_receipt` status — returns `idle` (with donation), `wrong_state` (any other status), `forbidden`, or `failed`. `uploadAndSubmit` uploads via `identity_document` purpose (private) then calls `submitReceipt` — returns `submitted`, `wrong_state` (donation_wrong_state), `forbidden`, or `failed` (media_upload_failed / worker error). Added `donationReceipt` to `apps/web/src/foundation.ts`. Created page at `apps/web/app/doacoes/[donationId]/comprovativo/page.tsx` using `use(params)`, `useRef` for ui instance, file input with `accept="image/*"`, and `handleSubmit` that sets uploading state before calling `uploadAndSubmit`. Also added `pending_receipt` and `pending_review` to `DonationClientStatus` (client package) and updated 3 status label maps (web doacoes list, mobile doacoes list, mobile donation status). 16 new tests, 2381 total, full pipeline green.
