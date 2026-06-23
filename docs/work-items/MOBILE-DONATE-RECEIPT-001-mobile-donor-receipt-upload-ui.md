# Work-Item: MOBILE-DONATE-RECEIPT-001 — Mobile Donor Receipt Upload UI

status: done

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

Created `apps/mobile/src/donation-receipt.ts` with `mobileDonationReceiptUiContent` (pt-PT, product-flow-ready, 8 states: loading/idle/uploading/submitting/submitted/failed/wrong_state/forbidden), `MobileDonationReceiptViewModel` union, `MobileDonationReceiptFileInput` type (uri/type/name/size), and `createMobileDonationReceiptUi({ donationStatusClient, mediaUploadClient, submitReceiptClient })`. `loadDonation` checks `pending_receipt` status — returns `idle` (with donation), `wrong_state` (any other status), `forbidden`, or `failed`. `uploadAndSubmit` builds FormData from the file input, uploads via `identity_document` purpose (private), then calls `submitReceipt` — returns `submitted`, `wrong_state`, `forbidden`, or `failed`. Added `donationReceipt` to `apps/mobile/src/foundation.ts`. Screen at `apps/mobile/app/doacoes/[donationId]/comprovativo.tsx` uses `useLocalSearchParams`, `useRef` for ui instance; `handleSelectAndUpload` shows an Alert picker before calling `uploadAndSubmit`. 16 new tests, 2397 total, full pipeline green.
