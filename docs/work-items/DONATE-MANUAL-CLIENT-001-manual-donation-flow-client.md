# Work-Item: DONATE-MANUAL-CLIENT-001 — Manual Donation Flow Client

status: done

## 1. Context & Problem

`DONATE-MANUAL-WORKER-001` (merged) exposes `PATCH /donations/:id/receipt` and
`PATCH /donations/:id/review`. The donation and shelter UI modules need typed client
functions to call these endpoints. Without them, donors cannot submit proof and shelter
volunteers cannot approve or reject donations.

## Goal

Extend `packages/client/src/donations.ts` with two new client factory functions:
- `createSubmitReceiptClient` — donor links a receipt image to a donation.
- `createReviewDonationClient` — shelter member approves or rejects a `pending_review` donation.

## States

### SubmitReceipt
- `unauthenticated`: token missing.
- `forbidden`: actor is not the donor.
- `donation_not_found`: donation does not exist.
- `donation_wrong_state`: donation is not in `pending_receipt`.
- `receipt_media_not_found`: media asset does not exist or is not owned by the actor.
- `receipt_submitted`: success.
- `worker_request_failed` / `worker_response_invalid`: network/parse failure.

### ReviewDonation
- `unauthenticated`: token missing.
- `forbidden`: actor is not a shelter member.
- `donation_not_found`: donation does not exist.
- `donation_wrong_state`: donation is not in `pending_review`.
- `donation_approved` / `donation_rejected`: success (matches decision).
- `worker_request_failed` / `worker_response_invalid`: network/parse failure.

## Acceptance Criteria

- [x] Add to `packages/client/src/donations.ts`:
  - `SubmitReceiptClientInput` — `{ receiptMediaId: string }`.
  - `SubmitReceiptClientSuccess` — `{ ok: true; status: 'receipt_submitted'; donationId: string }`.
  - `SubmitReceiptClientFailure` and `SubmitReceiptClientResult` types.
  - `SubmitReceiptClient` — `{ submitReceipt(donationId, input): Promise<SubmitReceiptClientResult> }`.
  - `createSubmitReceiptClient({ workerBaseUrl, donationsPath, getAccessToken, fetch })`.
  - `ReviewDonationClientInput` — `{ decision: 'approved' | 'rejected' }`.
  - `ReviewDonationClientSuccess` — `{ ok: true; status: 'donation_approved' | 'donation_rejected'; donationId: string }`.
  - `ReviewDonationClientFailure` and `ReviewDonationClientResult` types.
  - `ReviewDonationClient` — `{ reviewDonation(donationId, input): Promise<ReviewDonationClientResult> }`.
  - `createReviewDonationClient({ workerBaseUrl, donationsPath, getAccessToken, fetch })`.
- [x] Export all new types and factories from `packages/client/src/index.ts`.
- [x] Tests in `tests/client/donation-manual-client.test.ts`:
  - Submit receipt: unauthenticated, donation not found, wrong state, missing media, success.
  - Review: unauthenticated, forbidden, wrong state, approve success, reject success.
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement mobile or web UI modules (see `MOBILE-DONATE-RECEIPT-001`, etc.).
- Do not validate `receiptMediaId` format client-side.

## Affected files

- `packages/client/src/donations.ts`
- `packages/client/src/index.ts`
- `tests/client/donation-manual-client.test.ts`

## Completion Notes

Added `createSubmitReceiptClient` (PATCH `/donations/:id/receipt`) and `createReviewDonationClient` (PATCH `/donations/:id/review`) to `packages/client/src/donations.ts`. Both factories follow the established client pattern: unauthenticated guard, PATCH with Bearer + JSON body, typed success/failure parsing. `SubmitReceiptClientSuccess` holds `{ status: 'receipt_submitted', donationId }`. `ReviewDonationClientSuccess` holds `{ status: 'donation_approved' | 'donation_rejected', donationId }`. All new types auto-exported via existing `index.ts` barrel. 16 new tests, 2335 total, full pipeline green.
