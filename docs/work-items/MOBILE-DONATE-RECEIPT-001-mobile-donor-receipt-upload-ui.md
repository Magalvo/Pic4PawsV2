# Work-Item: MOBILE-DONATE-RECEIPT-001 — Mobile Donor Receipt Upload UI

status: open

## Goal

Create the mobile receipt upload screen at `/doacoes/[donationId]/comprovativo`. After
making a bank transfer, the donor navigates to this screen to photograph or select a proof
of payment and link it to the donation, transitioning it to `pending_review`.

## States

- `loading`: useEffect loading donation status (to verify it is `pending_receipt`).
- `idle`: donation details shown + upload prompt.
- `uploading`: media upload in flight.
- `submitting`: PATCH /receipt in flight after upload completes.
- `submitted`: receipt linked; show confirmation and link back to `/doacoes/[donationId]`.
- `failed`: upload or submit error with retry.
- `wrong_state`: donation is not in `pending_receipt` (already reviewed or paid).
- `forbidden`: actor is not the donor.

## Contract

Create `apps/mobile/src/donation-receipt.ts`:
- `MobileDonationReceiptUiContent` + `mobileDonationReceiptUiContent` (locale `pt-PT`).
- State types covering all states above.
- `createMobileDonationReceiptUi({ donationStatusClient, mediaUploadClient, submitReceiptClient })`:
  - `loadDonation(donationId)` → validates status is `pending_receipt`.
  - `uploadAndSubmit(donationId, file)` → uploads image to R2 via `mediaUploadClient`,
    then calls `submitReceiptClient.submitReceipt(donationId, { receiptMediaId })`.

Create `apps/mobile/app/doacoes/[donationId]/comprovativo.tsx`:
- `useLocalSearchParams` for `donationId`.
- `useEffect` on mount calls `ui.loadDonation(donationId)`.
- Camera/gallery picker button; on select, calls `ui.uploadAndSubmit(donationId, file)`.
- All copy in PT-PT.

Tests in `tests/mobile/donation-receipt-ui.test.ts`. Final validation must pass.

## Affected Files

- `apps/mobile/src/donation-receipt.ts`
- `apps/mobile/app/doacoes/[donationId]/comprovativo.tsx`
- `tests/mobile/donation-receipt-ui.test.ts`

## Completion Notes

Pending implementation.
