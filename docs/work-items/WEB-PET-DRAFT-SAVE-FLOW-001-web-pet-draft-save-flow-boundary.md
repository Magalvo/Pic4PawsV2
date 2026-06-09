# Work-Item: WEB-PET-DRAFT-SAVE-FLOW-001 — Web Pet Draft Save Flow Boundary

## 1. Context & Problem

`PET-DRAFT-SAVE-FLOW-CLIENT-001` added a composed client that saves (or updates) a draft's
metadata and optionally uploads and attaches new image files in a single call.

The Web product layer needs a state-machine boundary that drives the entire draft save +
media upload flow, mapping each phase's outcome to a safe PT-PT UI state. Without this
boundary, the Web editor would need to orchestrate the two phases itself and handle
partial-failure states inline.

## 2. Acceptance Criteria

- [x] Web pet draft save flow product boundary added.
- [x] Boundary consumes injected `PetDraftSaveFlowClient` dependency.
- [x] States cover: `idle | saving | saved | failed`.
- [x] `saving` transitions immediately on `saveDraft` dispatch.
- [x] `saved` state surfaces PT-PT confirmation copy and `petId` from the successful flow result.
- [x] `failed` state distinguishes `draft_save` phase failures from `media_upload` phase failures in PT-PT copy.
- [x] UI-facing results never expose bearer tokens, signed upload URLs, or server internals.
- [x] All UI copy in PT-PT in `webPetDraftSaveFlowUiContent` with `locale === 'pt-PT'`.
- [x] Boundary exposed via `apps/web/src/foundation.ts` → `webFoundationContent.petDraftSaveFlow`.
- [x] Tests fail before implementation and pass after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real browser file inputs or auth session.
- Do not implement Mobile boundary (separate work item).
- Do not implement draft publish from this boundary.
- Do not re-implement the two-phase orchestration logic (that lives in the client).

## 4. Completion Notes

Implemented as part of the pet draft save flow batch. Merged to main.
