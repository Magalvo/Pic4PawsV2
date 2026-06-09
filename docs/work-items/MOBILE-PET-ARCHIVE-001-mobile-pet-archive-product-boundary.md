# Work-Item: MOBILE-PET-ARCHIVE-001 — Mobile Pet Archive Product Boundary

## 1. Context & Problem

`PET-ARCHIVE-CLIENT-001` added the shared client for archiving and unarchiving pets.
`WEB-PET-ARCHIVE-001` added the Web boundary.

Shelter staff managing pets from the Mobile app need their own boundary, adapted for mobile
UX conventions (bottom sheet confirmation) and PT-PT copy prefixed with `Mobile`.

## 2. Acceptance Criteria

- [x] Mobile pet archive product boundary added.
- [x] 4 states: `idle | submitting | succeeded | failed`.
- [x] Boundary consumes injected `PetArchiveClient` dependency (no direct Worker calls).
- [x] `idle` state surfaces the archive/unarchive action affordance with PT-PT confirmation copy.
- [x] `submitting` transitions immediately on action dispatch.
- [x] `succeeded` surfaces PT-PT confirmation copy and the updated pet status.
- [x] `failed` surfaces PT-PT error copy without exposing server internals.
- [x] All UI copy in PT-PT in `mobilePetArchiveUiContent` with `locale === 'pt-PT'`.
- [x] Boundary `status` field set to `'product-flow-ready'`.
- [x] Boundary exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.petArchive`.
- [x] UI-facing results never expose bearer tokens, pet owner IDs, or server internals.
- [x] 10 tests — failing before implementation, passing after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real React Native navigation or auth session.
- Do not implement Web boundary (separate work item).
- Do not implement pet deletion (archive only, reversible).

## 4. Completion Notes

Implemented on branch `agent/MOBILE-PET-ARCHIVE-001`. Merged as PR #93.
