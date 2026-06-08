# Work-Item: MOBILE-SPONSORSHIP-MANAGE-001 — Mobile Sponsorship Manage UI

## 1. Context & Problem

`SPONSORSHIP-MANAGE-CLIENT-001` (merged, PR #69) exposes `createSponsorshipManageClient`.
`WEB-SPONSORSHIP-MANAGE-001` (PR #70) implements the web boundary.
The Mobile app has no product boundary for managing (cancel/pause/resume) a sponsorship.

## 2. Acceptance Criteria

- [ ] Create `apps/mobile/src/sponsorship-manage.ts` — mirrors WEB-SPONSORSHIP-MANAGE-001 with `Mobile` prefix.
- [ ] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileSponsorshipManageUiContent`, `MobileSponsorshipManageUiContent`.
  - Add `sponsorshipManage: Pick<MobileSponsorshipManageUiContent, 'title' | 'description' | 'status'>`.
- [ ] Tests: `tests/mobile/sponsorship-manage-ui.test.ts` (≥ 9 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No new client or worker changes.

## 4. Completion Notes

_To be filled in after implementation._
