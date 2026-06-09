# Work-Item: MOBILE-PET-DRAFT-SAVE-FLOW-001 — Mobile Pet Draft Save Flow Boundary

## 1. Context & Problem

`PET-DRAFT-SAVE-FLOW-CLIENT-001` added a composed client that saves (or updates) a draft's
metadata and optionally uploads and attaches new image files in a single call.
`WEB-PET-DRAFT-SAVE-FLOW-001` added the Web boundary.

The Mobile product layer needs its own boundary mirroring the Web boundary, adapted for
mobile UX conventions and PT-PT copy prefixed with `Mobile`.

## 2. Acceptance Criteria

- [x] Mobile pet draft save flow product boundary added.
- [x] Boundary consumes injected `PetDraftSaveFlowClient` dependency.
- [x] States cover: `idle | saving | saved | failed`.
- [x] `saving` transitions immediately on `saveDraft` dispatch.
- [x] `saved` state surfaces PT-PT confirmation copy and `petId` from the successful flow result.
- [x] `failed` state distinguishes `draft_save` phase failures from `media_upload` phase failures in PT-PT copy.
- [x] UI-facing results never expose bearer tokens, signed upload URLs, or server internals.
- [x] All UI copy in PT-PT in `mobilePetDraftSaveFlowUiContent` with `locale === 'pt-PT'`.
- [x] Boundary exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.petDraftSaveFlow`.
- [x] Tests fail before implementation and pass after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real React Native file pickers or auth session.
- Do not implement Web boundary (separate work item).
- Do not implement draft publish from this boundary.
- Do not re-implement the two-phase orchestration logic (that lives in the client).

## 4. Completion Notes

Implemented as part of the pet draft save flow batch. Merged to main.
