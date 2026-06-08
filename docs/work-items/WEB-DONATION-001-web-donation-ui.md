# Work-Item: WEB-DONATION-001 — Web Donation UI

## 1. Context & Problem

`DONATION-CLIENT-001` (merged) exposes `createDonationClient` in `@pic4paws/client`.
No Web product boundary exists — the web app cannot present a donation flow to users.

## 2. Acceptance Criteria

- [ ] Create `apps/web/src/donation.ts`:
  - `WebDonationUiContent` type + `webDonationUiContent` constant (locale `pt-PT`,
    status `product-flow-ready`, 4 states: `idle`, `submitting`, `submitted`, `failed`).
  - State types: `WebDonationIdleState`, `WebDonationSubmittingState`,
    `WebDonationSubmittedState` (donationId, amountCents, currency, kind, shelterId, createdAt),
    `WebDonationFailedState` (status, reasons, canRetry: true).
  - `WebDonationResultViewModel` — union of all four state types.
  - `createWebDonationUi({ donationClient })`:
    - `getInitialState()` → `WebDonationIdleState` with PT-PT copy + `primaryAction: 'Doar'`.
    - `submitDonation(input)` → `WebDonationSubmittedState | WebDonationFailedState`.
    - All failure statuses collapse to `failed` + `canRetry: true`.
    - Credential markers sanitized from `reasons` (defense-in-depth).
  - All copy in PT-PT.
- [ ] Modify `apps/web/src/foundation.ts`:
  - Import `webDonationUiContent`, `WebDonationUiContent`.
  - Add `donation: Pick<WebDonationUiContent, 'title' | 'description' | 'status'>` to
    `WebFoundationContent` type.
  - Add `donation` entry to `webFoundationContent` value.
- [ ] Tests: `tests/web/donation-ui.test.ts` (≥ 9 tests, fail before impl, pass after).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Mobile donation boundary (`MOBILE-DONATION-001`).
- Do not integrate a real payment provider or payment UI component.

## 4. Completion Notes

_To be filled in after implementation._
