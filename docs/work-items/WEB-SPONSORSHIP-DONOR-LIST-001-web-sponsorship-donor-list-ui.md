# Work-Item: WEB-SPONSORSHIP-DONOR-LIST-001 — Web Sponsorship Donor List UI

## 1. Context & Problem

`SPONSORSHIP-DONOR-LIST-CLIENT-001` (merged, PR #73) exposes `createSponsorshipDonorListClient`.
The web app has no product boundary for a donor to view their own recurring sponsorships.

## 2. Acceptance Criteria

- [ ] Create `apps/web/src/sponsorship-donor-list.ts`:
  - `WebSponsorshipDonorListUiContent` + `webSponsorshipDonorListUiContent` (PT-PT, product-flow-ready)
  - 5 states: `idle / loading / loaded / empty / failed` (no `forbidden` — donor owns their data)
  - `WebSponsorshipDonorListLoadedState` includes `sponsorships: SponsorshipListItem[]` + `total: number`
  - `WebSponsorshipDonorListFailedState` includes `status`, `reasons`, `canRetry: true`
  - `createWebSponsorshipDonorListUi({ sponsorshipDonorListClient })`
  - `loadDonorSponsorships(query?)` — no shelterId argument
  - Credential sanitization via `unsafeReasonMarkers` + `sanitizeReasons`
- [ ] Modify `apps/web/src/foundation.ts`:
  - Import `webSponsorshipDonorListUiContent`, `WebSponsorshipDonorListUiContent`
  - Add `sponsorshipDonorList: Pick<WebSponsorshipDonorListUiContent, 'title' | 'description' | 'status'>`
- [ ] Tests: `tests/web/sponsorship-donor-list-ui.test.ts` (≥ 9 tests, fail → pass)
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## 3. State Difference vs Shelter List

The shelter-side list has a `forbidden` state (non-member trying to view a shelter's
sponsorships). The donor list has no `forbidden` — the authenticated actor always accesses
their own data. Failed access (e.g. `unauthenticated`) maps to `failed`.

## 4. Completion Notes

_To be filled in after implementation._
