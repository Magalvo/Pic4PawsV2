# Work-Item: MOBILE-SPONSORSHIP-LIST-001 — Mobile Sponsorship List UI

## 1. Context & Problem

`SPONSORSHIP-LIST-CLIENT-001` (merged, PR #65) exposes `createSponsorshipListClient`.
`WEB-SPONSORSHIP-LIST-001` (merged, PR #66) implements the web boundary.
The Mobile app has no product boundary for the shelter-side recurring sponsorship list.

## 2. Acceptance Criteria

- [x] Create `apps/mobile/src/sponsorship-list.ts` — mirrors WEB-SPONSORSHIP-LIST-001 with `Mobile` prefix.
- [x] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileSponsorshipListUiContent`, `MobileSponsorshipListUiContent`.
  - Add `sponsorshipList: Pick<MobileSponsorshipListUiContent, 'title' | 'description' | 'status'>` to type and value.
- [x] Tests: `tests/mobile/sponsorship-list-ui.test.ts` (10 tests, all pass).
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No new client or worker changes.

## 4. Completion Notes

Completed 2026-06-08. PR #67 (`agent/MOBILE-SPONSORSHIP-LIST-001`).

- `apps/mobile/src/sponsorship-list.ts` — exact mirror of WEB-SPONSORSHIP-LIST-001 with `Mobile` prefix.
  - `MobileSponsorshipListUiContent`, `mobileSponsorshipListUiContent` (`locale: 'pt-PT'`, `status: 'product-flow-ready'`, 6 states).
  - 6 state types: `MobileSponsorshipListIdleState`, `MobileSponsorshipListLoadingState`, `MobileSponsorshipListLoadedState`, `MobileSponsorshipListEmptyState`, `MobileSponsorshipListForbiddenState`, `MobileSponsorshipListFailedState`.
  - `createMobileSponsorshipListUi({ sponsorshipListClient })` — `getInitialState()` + `loadSponsorships(shelterId, query?)`.
  - Dedicated `forbidden` state separate from `failed`. `sanitizeReasons` strips credential markers.
- `apps/mobile/src/foundation.ts` — `sponsorshipList` entry added.
- `tests/mobile/sponsorship-list-ui.test.ts` — 10 tests: idle, 6-state content, loaded, empty, forbidden isolation, worker_request_failed, unauthenticated, credential stripping, pt-PT locale, foundation exposure.
- Validation: 650/650 tests passing, typecheck clean, lint clean, build clean.
