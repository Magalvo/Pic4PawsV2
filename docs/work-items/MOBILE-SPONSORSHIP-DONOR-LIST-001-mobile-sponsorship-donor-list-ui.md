# Work-Item: MOBILE-SPONSORSHIP-DONOR-LIST-001 — Mobile Sponsorship Donor List UI

## 1. Context & Problem

`SPONSORSHIP-DONOR-LIST-CLIENT-001` (merged, PR #73) exposes `createSponsorshipDonorListClient`.
`WEB-SPONSORSHIP-DONOR-LIST-001` (PR #74) implements the web boundary.
The Mobile app needs an equivalent product boundary for a donor to view their own sponsorships.

## 2. Acceptance Criteria

- [x] Create `apps/mobile/src/sponsorship-donor-list.ts` — mirrors WEB-SPONSORSHIP-DONOR-LIST-001 with `Mobile` prefix.
- [x] Modify `apps/mobile/src/foundation.ts`:
  - Import `mobileSponsorshipDonorListUiContent`, `MobileSponsorshipDonorListUiContent`.
  - Add `sponsorshipDonorList: Pick<MobileSponsorshipDonorListUiContent, 'title' | 'description' | 'status'>`.
- [x] Tests: `tests/mobile/sponsorship-donor-list-ui.test.ts` (10 tests, fail → pass).
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Completion Notes

Implemented. 5 states (no `forbidden`). Identical PT-PT copy to web boundary.
