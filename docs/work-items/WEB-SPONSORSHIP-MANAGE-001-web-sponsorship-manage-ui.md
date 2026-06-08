# Work-Item: WEB-SPONSORSHIP-MANAGE-001 — Web Sponsorship Manage UI

## 1. Context & Problem

`SPONSORSHIP-MANAGE-CLIENT-001` (merged, PR #69) exposes `createSponsorshipManageClient`.
The Web app has no product boundary for managing (cancel/pause/resume) a sponsorship.

## 2. Acceptance Criteria

- [ ] Create `apps/web/src/sponsorship-manage.ts`:
  - `WebSponsorshipManageUiContent` with `locale: 'pt-PT'`, `status: 'product-flow-ready'`, 4 states.
  - `webSponsorshipManageUiContent` — PT-PT copy.
  - 4 state types: `WebSponsorshipManageIdleState`, `WebSponsorshipManageSubmittingState`,
    `WebSponsorshipManageSucceededState` (with `sponsorshipId`, `newStatus`),
    `WebSponsorshipManageFailedState` (with `status`, `reasons`, `canRetry: true`).
  - `WebSponsorshipManageResultViewModel` union.
  - `unsafeReasonMarkers` + `sanitizeReasons`.
  - `createWebSponsorshipManageUi({ sponsorshipManageClient })` —
    `getInitialState()` → idle, `manageSponsorship(sponsorshipId, status)` → succeeded | failed.
- [ ] Modify `apps/web/src/foundation.ts`:
  - Import `webSponsorshipManageUiContent`, `WebSponsorshipManageUiContent`.
  - Add `sponsorshipManage: Pick<WebSponsorshipManageUiContent, 'title' | 'description' | 'status'>`.
- [ ] Tests: `tests/web/sponsorship-manage-ui.test.ts` (≥ 9 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No new client or worker changes.

## 4. Completion Notes

_To be filled in after implementation._
