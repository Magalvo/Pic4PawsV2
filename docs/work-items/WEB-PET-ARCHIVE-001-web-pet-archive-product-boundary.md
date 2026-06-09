# Work-Item: WEB-PET-ARCHIVE-001 — Web Pet Archive Product Boundary

## 1. Context & Problem

`PET-ARCHIVE-CLIENT-001` added the shared client for archiving and unarchiving pets.

Shelter staff managing pets from the Web app need a product boundary that drives the archive
action through a safe state machine, shows a confirmation step before archiving, and surfaces
PT-PT feedback on success or failure.

## 2. Acceptance Criteria

- [x] Web pet archive product boundary added.
- [x] 4 states: `idle | submitting | succeeded | failed`.
- [x] Boundary consumes injected `PetArchiveClient` dependency (no direct Worker calls).
- [x] `idle` state surfaces the archive/unarchive action affordance with PT-PT confirmation copy.
- [x] `submitting` transitions immediately on action dispatch.
- [x] `succeeded` surfaces PT-PT confirmation copy and the updated pet status.
- [x] `failed` surfaces PT-PT error copy without exposing server internals.
- [x] All UI copy in PT-PT in `webPetArchiveUiContent` with `locale === 'pt-PT'`.
- [x] Boundary exposed via `apps/web/src/foundation.ts` → `webFoundationContent.petArchive`.
- [x] UI-facing results never expose bearer tokens, pet owner IDs, or server internals.
- [x] 10 tests — failing before implementation, passing after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real browser forms or auth session.
- Do not implement Mobile boundary (separate work item).
- Do not implement pet deletion (archive only, reversible).

## 4. Completion Notes

Implemented on branch `agent/WEB-PET-ARCHIVE-001`. Merged as PR #92.
