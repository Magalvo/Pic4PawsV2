# Work-Item: MOBILE-DONATION-001 — Mobile Donation UI

## 1. Context & Problem

`DONATION-CLIENT-001` (merged) exposes `createDonationClient` in `@pic4paws/client`.
`WEB-DONATION-001` (merged) adds the Web boundary.
No Mobile product boundary exists — the mobile app cannot present a donation flow to users.

## 2. Acceptance Criteria

- [ ] Create `apps/mobile/src/donation.ts`:
  - `MobileDonationUiContent` type + `mobileDonationUiContent` constant (locale `pt-PT`,
    status `product-flow-ready`, 4 states: `idle`, `submitting`, `submitted`, `failed`).
  - State types: `MobileDonationIdleState`, `MobileDonationSubmittingState`,
    `MobileDonationSubmittedState` (donationId, amountCents, currency, kind, shelterId, createdAt),
    `MobileDonationFailedState` (status, reasons, canRetry: true).
  - `MobileDonationResultViewModel` — union of all four state types.
  - `createMobileDonationUi({ donationClient })`:
    - `getInitialState()` → `MobileDonationIdleState` with PT-PT copy + `primaryAction: 'Doar'`.
    - `submitDonation(input)` → `MobileDonationSubmittedState | MobileDonationFailedState`.
    - All failure statuses collapse to `failed` + `canRetry: true`.
    - Credential markers sanitized from `reasons` (defense-in-depth).
  - All copy in PT-PT.
- [ ] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileDonationUiContent`, `MobileDonationUiContent`.
  - Add `donation: Pick<MobileDonationUiContent, 'title' | 'description' | 'status'>` to
    `MobileFoundationContent` type.
  - Add `donation` entry to `mobileFoundationContent` value.
- [ ] Tests: `tests/mobile/donation-ui.test.ts` (≥ 9 tests, fail before impl, pass after).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Web donation boundary (`WEB-DONATION-001` — already done).
- Do not integrate a real payment provider or payment UI component.

## 4. Completion Notes

_To be filled in after implementation._
