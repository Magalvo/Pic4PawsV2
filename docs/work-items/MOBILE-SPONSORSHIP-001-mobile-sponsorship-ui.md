# Work-Item: MOBILE-SPONSORSHIP-001 — Mobile Sponsorship UI

## 1. Context & Problem

`SPONSORSHIP-CLIENT-001` (merged, PR #61) exposes `createSponsorshipClient`.
`WEB-SPONSORSHIP-001` (merged, PR #62) implements the web boundary.
The Mobile app has no product boundary for the recurring sponsorship submission flow.

## 2. Acceptance Criteria

- [ ] Create `apps/mobile/src/sponsorship.ts` — mirrors WEB-SPONSORSHIP-001 with `Mobile` prefix.
- [ ] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileSponsorshipUiContent`, `MobileSponsorshipUiContent`.
  - Add `sponsorship: Pick<MobileSponsorshipUiContent, 'title' | 'description' | 'status'>` to type and value.
- [ ] Tests: `tests/mobile/sponsorship-ui.test.ts` (≥ 8 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No new client or worker changes.

## 4. Completion Notes

_To be filled in after implementation._
