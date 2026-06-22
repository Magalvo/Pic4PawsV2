# Work-Item: WEB-DONATE-RECEIPT-001 — Web Donor Receipt Upload UI

status: open

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

Pending implementation.
