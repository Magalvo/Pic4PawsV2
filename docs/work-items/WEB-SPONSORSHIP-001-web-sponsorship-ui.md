# Work-Item: WEB-SPONSORSHIP-001 — Web Sponsorship UI

## 1. Context & Problem

`SPONSORSHIP-CLIENT-001` (merged, PR #61) exposes `createSponsorshipClient`.
The Web app has no product boundary for the recurring sponsorship submission flow.

## 2. Acceptance Criteria

- [ ] Create `apps/web/src/sponsorship.ts`:
  - `WebSponsorshipUiContent` type + `webSponsorshipUiContent` constant
    (locale `pt-PT`, status `product-flow-ready`, 4 states: `idle`, `submitting`,
    `submitted`, `failed`).
  - State types: `WebSponsorshipIdleState`, `WebSponsorshipSubmittingState`,
    `WebSponsorshipSubmittedState` (with `sponsorshipId`, `recurringInterval`, etc.),
    `WebSponsorshipFailedState` (status, reasons, canRetry: true).
  - `WebSponsorshipResultViewModel` — union of all four state types.
  - `createWebSponsorshipUi({ sponsorshipClient })`:
    - `getInitialState()` → `WebSponsorshipIdleState` with PT-PT copy.
    - `submitSponsorship(input)` → submitted | failed.
    - Credential markers sanitized from `reasons` in `failed`.
  - All copy in PT-PT.
- [ ] Modify `apps/web/src/foundation.ts`:
  - Import `webSponsorshipUiContent`, `WebSponsorshipUiContent`.
  - Add `sponsorship: Pick<WebSponsorshipUiContent, 'title' | 'description' | 'status'>` to type and value.
- [ ] Tests: `tests/web/sponsorship-ui.test.ts` (≥ 8 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Mobile boundary (`MOBILE-SPONSORSHIP-001`).

## 4. Completion Notes

_To be filled in after implementation._
