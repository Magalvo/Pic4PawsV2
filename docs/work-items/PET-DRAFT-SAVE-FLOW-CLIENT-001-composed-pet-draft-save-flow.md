# Work-Item: PET-DRAFT-SAVE-FLOW-CLIENT-001 — Composed Pet Draft Save Flow

## 1. Context & Problem

`PET-DRAFT-CLIENT-001` added a shared client for creating and updating pet drafts.
`PET-MEDIA-UPLOAD-ATTACH-FLOW-001` added a composed flow for uploading a file and attaching it to a pet draft.

Web and Mobile still need a single platform-neutral entry point that combines these two operations:
save (or update) a draft's metadata and, optionally, upload and attach one or more new image files in the same call.
Without this composition layer, each platform boundary must re-implement the sequencing and failure-phase mapping itself.

## 2. Acceptance Criteria

- [ ] Add a `PetDraftSaveFlowClient` to `@pic4paws/client` with a single method `savePetDraft`.
- [ ] The client accepts an `operation` field (`'create'` or `'update'`) to select the draft save direction.
- [ ] The client accepts a `petId`, `shelterId` and all draft metadata fields.
- [ ] The client accepts `existingMediaIds: string[]` — already-attached media IDs forwarded directly to the draft save.
- [ ] The client accepts `newFiles?: PetDraftSaveFlowFileInput[]` — optional new image files to upload and attach.
- [ ] The draft save (create or update) is always attempted first; no media upload is attempted if the draft save fails.
- [ ] After a successful draft save, new files are uploaded and attached sequentially using the injected upload-attach dependency.
- [ ] If any file upload or attach fails, the flow stops and returns a failure result; no subsequent files are attempted.
- [ ] Success returns a safe result containing `petId`, `operation`, and an `uploadedMedia` array with per-file attachment metadata.
- [ ] Draft save failures are returned as `{ ok: false, phase: 'draft_save', status, reasons }`.
- [ ] Media upload/attach failures are returned as `{ ok: false, phase: 'media_upload', subPhase, status, reasons, ... }` with `subPhase` matching the inner flow phase (`upload_intent`, `binary_upload`, or `attach`).
- [ ] Flow-facing results never expose bearer tokens, Supabase service-role keys, R2 access/secret keys, or signed upload URLs.
- [ ] All failure reasons are sanitized through the existing `sanitizeReasons` guard before being included in the result.
- [ ] The factory `createPetDraftSaveFlowClient` accepts only injected dependencies (`draftClient`, `uploadAttachClient`); it makes no network calls itself.
- [ ] Tests are written first (failing), then the implementation is added.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile draft editor UI.
- Do not connect production auth/session state or live Worker calls.
- Do not implement publish behavior.
- Do not move server-side draft validation into the client.
- Do not implement parallel or concurrent file uploads (sequential is sufficient for this work item).
- Do not set `heroMediaId` automatically from a newly uploaded file; `heroMediaId` is a caller-supplied field applied at draft-save time only.

## 4. Completion Notes

_To be filled in after implementation._
