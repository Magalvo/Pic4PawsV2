# Work-Item: MOBILE-SPONSORSHIP-001 — Mobile Sponsorship UI

## 1. Context & Problem

`SPONSORSHIP-CLIENT-001` (merged, PR #61) exposes `createSponsorshipClient`.
`WEB-SPONSORSHIP-001` (merged, PR #62) implements the web boundary.
The Mobile app has no product boundary for the recurring sponsorship submission flow.

## 2. Acceptance Criteria

- [x] Create `apps/mobile/src/sponsorship.ts` — mirrors WEB-SPONSORSHIP-001 with `Mobile` prefix.
- [x] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileSponsorshipUiContent`, `MobileSponsorshipUiContent`.
  - Add `sponsorship: Pick<MobileSponsorshipUiContent, 'title' | 'description' | 'status'>` to type and value.
- [x] Tests: `tests/mobile/sponsorship-ui.test.ts` (9 tests, fail → pass).
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No new client or worker changes.

## 4. Completion Notes

Completed 2026-06-08. PR #63.

- `apps/mobile/src/sponsorship.ts` — exact mirror of web boundary with `Mobile` prefix. Same PT-PT copy, same 4 states (idle/submitting/submitted/failed), same `unsafeReasonMarkers` + `sanitizeReasons`.
- `apps/mobile/src/foundation.ts` — added `sponsorship` import and entry.
- `tests/mobile/sponsorship-ui.test.ts` — 9 tests covering all states, sanitizeReasons, and foundation exposure.
- All validation clean: typecheck, lint, 605/605 tests, build.
