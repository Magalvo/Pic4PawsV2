# Work-Item: MOBILE-DONATE-REVIEW-001 — Mobile Shelter Donation Review UI

status: open

## Goal

Create the mobile shelter donation review screen at `/abrigos/[shelterId]/doacoes/[donationId]`.
Shelter volunteers see the donation details, view the uploaded receipt image, and tap
Aprovar or Rejeitar to finalize the manual donation.

## States

- `loading`: fetching donation + receipt details.
- `idle`: donation details displayed with receipt preview and action buttons.
- `approving`: PATCH /review with `approved` in flight.
- `rejecting`: PATCH /review with `rejected` in flight.
- `approved`: success state — donation is now `paid`.
- `rejected`: success state — donation is `rejected`.
- `failed`: error with retry.
- `forbidden`: actor is not a shelter member.
- `wrong_state`: donation is not in `pending_review`.

## Contract

Create `apps/mobile/src/donation-review.ts`:
- `MobileDonationReviewUiContent` + `mobileDonationReviewUiContent` (locale `pt-PT`).
- State types covering all states.
- `createMobileDonationReviewUi({ donationStatusClient, reviewDonationClient })`:
  - `loadDonation(donationId)` — validates `pending_review` status.
  - `approve(donationId)` → `Approved | Failed`.
  - `reject(donationId)` → `Rejected | Failed`.

Create `apps/mobile/app/abrigos/[shelterId]/doacoes/[donationId].tsx`:
- `useLocalSearchParams` for `shelterId` and `donationId`.
- `useEffect` on mount calls `ui.loadDonation(donationId)`.
- Receipt image shown using the media asset URL.
- Two action buttons: "Aprovar" and "Rejeitar" with confirmation prompt.
- All copy in PT-PT.

Tests in `tests/mobile/donation-review-ui.test.ts`. Final validation must pass.

## Affected Files

- `apps/mobile/src/donation-review.ts`
- `apps/mobile/app/abrigos/[shelterId]/doacoes/[donationId].tsx`
- `tests/mobile/donation-review-ui.test.ts`

## Completion Notes

Pending implementation.
