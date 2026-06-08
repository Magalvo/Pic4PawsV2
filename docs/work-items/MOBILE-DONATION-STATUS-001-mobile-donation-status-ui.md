# Work-Item: MOBILE-DONATION-STATUS-001 — Mobile Donation Status UI

## 1. Context & Problem

`DONATION-STATUS-CLIENT-001` (merged, PR #57) exposes `createDonationStatusClient`.
`WEB-DONATION-STATUS-001` (merged, PR #58) implements the web boundary.
The Mobile app has no product boundary to present the donor's donation status to the user.

## 2. Acceptance Criteria

- [ ] Create `apps/mobile/src/donation-status.ts`:
  - `MobileDonationStatusUiContent` type + `mobileDonationStatusUiContent` constant
    (locale `pt-PT`, status `product-flow-ready`, 6 states: `idle`, `loading`, `loaded`,
    `not_found`, `forbidden`, `failed`).
  - State types: `MobileDonationStatusIdleState`, `MobileDonationStatusLoadingState`,
    `MobileDonationStatusLoadedState` (donation: DonationStatusClientItem),
    `MobileDonationStatusNotFoundState`, `MobileDonationStatusForbiddenState`,
    `MobileDonationStatusFailedState` (status, reasons, canRetry: true).
  - `MobileDonationStatusResultViewModel` — union of all six state types.
  - `createMobileDonationStatusUi({ donationStatusClient })`:
    - `getInitialState()` → `MobileDonationStatusIdleState` with PT-PT copy.
    - `loadDonationStatus(donationId)` → loaded | not_found | forbidden | failed.
    - `forbidden` maps to dedicated `forbidden` state (not collapsed into `failed`).
    - `donation_not_found` maps to dedicated `not_found` state.
    - Credential markers sanitized from `reasons` in `failed`.
  - All copy in PT-PT.
- [ ] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileDonationStatusUiContent`, `MobileDonationStatusUiContent`.
  - Add `donationStatus: Pick<MobileDonationStatusUiContent, 'title' | 'description' | 'status'>` to type and value.
- [ ] Tests: `tests/mobile/donation-status-ui.test.ts` (≥ 9 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement any new client or worker changes.

## 4. Completion Notes

_To be filled in after implementation._
