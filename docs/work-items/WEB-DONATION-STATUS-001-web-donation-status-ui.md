# Work-Item: WEB-DONATION-STATUS-001 — Web Donation Status UI

## 1. Context & Problem

`DONATION-STATUS-CLIENT-001` (merged, PR #57) exposes `createDonationStatusClient`.
The Web app has no product boundary to present the donor's donation status to the user.

## 2. Acceptance Criteria

- [ ] Create `apps/web/src/donation-status.ts`:
  - `WebDonationStatusUiContent` type + `webDonationStatusUiContent` constant
    (locale `pt-PT`, status `product-flow-ready`, 6 states: `idle`, `loading`, `loaded`,
    `not_found`, `forbidden`, `failed`).
  - State types: `WebDonationStatusIdleState`, `WebDonationStatusLoadingState`,
    `WebDonationStatusLoadedState` (donation: DonationStatusClientItem),
    `WebDonationStatusNotFoundState`, `WebDonationStatusForbiddenState`,
    `WebDonationStatusFailedState` (status, reasons, canRetry: true).
  - `WebDonationStatusResultViewModel` — union of all six state types.
  - `createWebDonationStatusUi({ donationStatusClient })`:
    - `getInitialState()` → `WebDonationStatusIdleState` with PT-PT copy.
    - `loadDonationStatus(donationId)` → loaded | not_found | forbidden | failed.
    - `forbidden` maps to dedicated `forbidden` state (not collapsed into `failed`).
    - `donation_not_found` maps to dedicated `not_found` state.
    - Credential markers sanitized from `reasons` in `failed`.
  - All copy in PT-PT.
- [ ] Modify `apps/web/src/foundation.ts`:
  - Import `webDonationStatusUiContent`, `WebDonationStatusUiContent`.
  - Add `donationStatus: Pick<WebDonationStatusUiContent, 'title' | 'description' | 'status'>` to type and value.
- [ ] Tests: `tests/web/donation-status-ui.test.ts` (≥ 9 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Mobile boundary (`MOBILE-DONATION-STATUS-001`).

## 4. Completion Notes

_To be filled in after implementation._
