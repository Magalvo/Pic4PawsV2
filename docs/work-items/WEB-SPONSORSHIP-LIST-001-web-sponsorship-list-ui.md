# Work-Item: WEB-SPONSORSHIP-LIST-001 — Web Sponsorship List UI

## 1. Context & Problem

`SPONSORSHIP-LIST-CLIENT-001` (merged, PR #65) exposes `createSponsorshipListClient`.
The Web app has no product boundary for the shelter-side recurring sponsorship list.

## 2. Acceptance Criteria

- [ ] Create `apps/web/src/sponsorship-list.ts`:
  - `WebSponsorshipListUiContent` type + `webSponsorshipListUiContent` constant
    (locale `pt-PT`, status `product-flow-ready`, 6 states: `idle`, `loading`,
    `loaded`, `empty`, `forbidden`, `failed`).
  - State types: `WebSponsorshipListIdleState`, `WebSponsorshipListLoadingState`,
    `WebSponsorshipListLoadedState` (with `sponsorships: SponsorshipListItem[]`, `total`),
    `WebSponsorshipListEmptyState`, `WebSponsorshipListForbiddenState`,
    `WebSponsorshipListFailedState` (status, reasons, canRetry: true).
  - `WebSponsorshipListResultViewModel` — union of all six state types.
  - `createWebSponsorshipListUi({ sponsorshipListClient })`:
    - `getInitialState()` → `WebSponsorshipListIdleState` with PT-PT copy.
    - `loadSponsorships(shelterId, query?)` → loaded | empty | forbidden | failed.
    - `forbidden` status maps to dedicated `forbidden` state (not `failed`).
    - Credential markers sanitized from `reasons` in `failed`.
  - All copy in PT-PT.
- [ ] Modify `apps/web/src/foundation.ts`:
  - Import `webSponsorshipListUiContent`, `WebSponsorshipListUiContent`.
  - Add `sponsorshipList: Pick<WebSponsorshipListUiContent, 'title' | 'description' | 'status'>` to type and value.
- [ ] Tests: `tests/web/sponsorship-list-ui.test.ts` (≥ 9 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No Mobile boundary (`MOBILE-SPONSORSHIP-LIST-001`).

## 4. Completion Notes

_To be filled in after implementation._
