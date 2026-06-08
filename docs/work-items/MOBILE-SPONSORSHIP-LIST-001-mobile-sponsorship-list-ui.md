# Work-Item: MOBILE-SPONSORSHIP-LIST-001 — Mobile Sponsorship List UI

## 1. Context & Problem

`SPONSORSHIP-LIST-CLIENT-001` (merged, PR #65) exposes `createSponsorshipListClient`.
`WEB-SPONSORSHIP-LIST-001` (merged, PR #66) implements the web boundary.
The Mobile app has no product boundary for the shelter-side recurring sponsorship list.

## 2. Acceptance Criteria

- [ ] Create `apps/mobile/src/sponsorship-list.ts` — mirrors WEB-SPONSORSHIP-LIST-001 with `Mobile` prefix.
- [ ] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileSponsorshipListUiContent`, `MobileSponsorshipListUiContent`.
  - Add `sponsorshipList: Pick<MobileSponsorshipListUiContent, 'title' | 'description' | 'status'>` to type and value.
- [ ] Tests: `tests/mobile/sponsorship-list-ui.test.ts` (≥ 9 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No new client or worker changes.

## 4. Completion Notes

_To be filled in after implementation._
