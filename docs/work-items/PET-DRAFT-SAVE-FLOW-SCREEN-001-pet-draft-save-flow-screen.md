---
id: PET-DRAFT-SAVE-FLOW-SCREEN-001
title: Pet draft save flow screen
status: done
---

# Work-Item: PET-DRAFT-SAVE-FLOW-SCREEN-001 — Pet Draft Save Flow Screen

## Goal

Create the pet draft save flow screen at `/animais/rascunhos/[petId]/guardar` (mobile +
web) wired to `createMobilePetDraftSaveFlowUi` / `createWebPetDraftSaveFlowUi`. Auth-gated.
Loads the existing draft on mount (via `createMobilePetDraftUi` / `createWebPetDraftUi`),
pre-populates the form, and on submit calls `saveFlowUi.saveDraft` which saves the draft
text AND optionally uploads + attaches a new image in one atomic flow.

## States

- Loading (null `loadViewModel`) — spinner while draft is fetched
- Load error (`not_found` | `forbidden` | `failed`) — show error + back button
- `ready` — form populated from loaded draft; optional new file input
- Saving (local state) — disabled form, saving indicator
- `saved` — success with `operation`, `uploadedMediaCount`; navigate back
- `failed` — error with `phase` (`draft_save` | `media_upload`); retry button

## Affected Files

- `docs/work-items/PET-DRAFT-SAVE-FLOW-SCREEN-001-pet-draft-save-flow-screen.md` (this file)
- `apps/mobile/app/animais/rascunhos/[petId]/guardar.tsx` — new mobile screen
- `apps/web/app/animais/rascunhos/[petId]/guardar/page.tsx` — new web page
- `tests/mobile/pet-draft-save-flow-screen.test.ts` — mobile boundary contract tests
- `tests/web/pet-draft-save-flow-screen.test.ts` — web boundary contract tests

## Contract

- **Loading**: `createMobilePetDraftUi({ draftClient })` for `loadDraft(petId)` — pre-populates form
- **Saving**: `createMobilePetDraftSaveFlowUi({ saveFlowClient })`
- `saveFlowClient = createPetDraftSaveFlowClient({ draftClient, uploadAttachClient })`
  - `uploadAttachClient = createPetMediaUploadAttachFlowClient({ uploadClient, attachClient, generateMediaId })`
  - `uploadClient = createMediaUploadFlowClient({ workerBaseUrl, mediaUploadPath: '/uploads/media', getAccessToken, fetch })`
  - `attachClient = createPetMediaAttachClient({ workerBaseUrl, petDraftsPath: '/pets/drafts', getAccessToken, fetch })`
  - `generateMediaId` = timestamp + random suffix
- `getInitialState(context: { petName? })` → `ready` with `title`, `message`, `primaryAction`, `petName`
- `saveDraft({ context, draft: PetDraftSaveFlowInput })` → `saved | failed`
- `PetDraftSaveFlowInput.existingMediaIds` = `draft.mediaIds` from loaded draft
- `PetDraftSaveFlowInput.newFiles` = optional single file from URI input (mobile) / file input (web)
- URL params: `petId` (dynamic segment)
- Auth: Supabase `getSession()`, `persistSession: false`

## Completion Notes

- `FormState` extends `editar.tsx` to include `mediaIds: string[]` (needed for `existingMediaIds`)
- Loading boundary (`createMobilePetDraftUi`) and saving boundary (`createMobilePetDraftSaveFlowUi`) are both wired on the same screen — different operations
- Mobile file body: URI string fetched to Blob via `globalThis.fetch(uri)` (same pattern as PET-MEDIA-UPLOAD-SCREEN-001)
- Web file body: `File` from `<input type="file">` used directly as `BodyInit`
- `PetDraftSaveFlowSuccess.status = 'pet_draft_saved'`
- `PetDraftSaveFlowFailure` phases: `draft_save` | `media_upload` (subPhase: `upload_intent` | `binary_upload` | `attach`)
- Mobile import depth from `app/animais/rascunhos/[petId]/guardar.tsx`: `../../../../src/`
- Web import depth from `app/animais/rascunhos/[petId]/guardar/page.tsx`: `../../../../../src/`
