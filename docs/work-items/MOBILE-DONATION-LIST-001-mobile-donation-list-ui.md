# Work-Item: MOBILE-DONATION-LIST-001 — Mobile Donation List UI

## 1. Context & Problem

`DONATION-LIST-CLIENT-001` (merged) exposes `createDonationListClient` in `@pic4paws/client`.
`WEB-DONATION-LIST-001` (merged, PR #53) added the Web product boundary.
No Mobile product boundary exists — the mobile app cannot present the shelter donation list to users.

## 2. Acceptance Criteria

- [ ] Create `apps/mobile/src/donation-list.ts`:
  - `MobileDonationListUiContent` type + `mobileDonationListUiContent` constant (locale `pt-PT`,
    status `product-flow-ready`, 6 states: `idle`, `loading`, `loaded`, `empty`,
    `forbidden`, `failed`).
  - State types: `MobileDonationListIdleState`, `MobileDonationListLoadingState`,
    `MobileDonationListLoadedState` (donations, total), `MobileDonationListEmptyState`,
    `MobileDonationListForbiddenState`, `MobileDonationListFailedState` (status, reasons, canRetry: true).
  - `MobileDonationListResultViewModel` — union of all six state types.
  - `createMobileDonationListUi({ donationListClient })`:
    - `getInitialState()` → `MobileDonationListIdleState` with PT-PT copy.
    - `loadDonations(shelterId, query?)` → loaded | empty | forbidden | failed.
    - `forbidden` status maps to dedicated `forbidden` state (not collapsed into `failed`).
    - Credential markers sanitized from `reasons`.
  - All copy in PT-PT.
- [ ] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileDonationListUiContent`, `MobileDonationListUiContent`.
  - Add `donationList: Pick<MobileDonationListUiContent, 'title' | 'description' | 'status'>` to type.
  - Add `donationList` entry to value.
- [ ] Tests: `tests/mobile/donation-list-ui.test.ts` (≥ 9 tests, fail before impl, pass after).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not modify Worker, Client or Web layers (already complete).

## 4. Completion Notes

_To be filled in after implementation._
