# Work-Item: WEB-DONATION-LIST-001 — Web Donation List UI

## 1. Context & Problem

`DONATION-LIST-CLIENT-001` (merged) exposes `createDonationListClient` in `@pic4paws/client`.
No Web product boundary exists — the web app cannot present the shelter donation list to users.

## 2. Acceptance Criteria

- [ ] Create `apps/web/src/donation-list.ts`:
  - `WebDonationListUiContent` type + `webDonationListUiContent` constant (locale `pt-PT`,
    status `product-flow-ready`, 6 states: `idle`, `loading`, `loaded`, `empty`,
    `forbidden`, `failed`).
  - State types: `WebDonationListIdleState`, `WebDonationListLoadingState`,
    `WebDonationListLoadedState` (donations, total), `WebDonationListEmptyState`,
    `WebDonationListForbiddenState`, `WebDonationListFailedState` (status, reasons, canRetry: true).
  - `WebDonationListResultViewModel` — union of all six state types.
  - `createWebDonationListUi({ donationListClient })`:
    - `getInitialState()` → `WebDonationListIdleState` with PT-PT copy.
    - `loadDonations(shelterId, query?)` → loaded | empty | forbidden | failed.
    - `forbidden` status maps to dedicated `forbidden` state (not collapsed into `failed`).
    - Credential markers sanitized from `reasons`.
  - All copy in PT-PT.
- [ ] Modify `apps/web/src/foundation.ts`:
  - Import `webDonationListUiContent`, `WebDonationListUiContent`.
  - Add `donationList: Pick<WebDonationListUiContent, 'title' | 'description' | 'status'>` to type.
  - Add `donationList` entry to value.
- [ ] Tests: `tests/web/donation-list-ui.test.ts` (≥ 9 tests, fail before impl, pass after).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Mobile donation list boundary (`MOBILE-DONATION-LIST-001`).

## 4. Completion Notes

_To be filled in after implementation._
