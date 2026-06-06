# Work-Item: PET-MEDIA-UPLOAD-ATTACH-FLOW-001-Composed Pet Media Upload Attach Flow

## 1. Context & Problem

`PET-MEDIA-ATTACH-CLIENT-001` added a shared client for attaching persisted media assets to pet drafts. The product still needs one Web/Mobile-safe flow that uploads a public pet image and then attaches the persisted media asset to the draft.

The flow must preserve distinct failure phases so UI can explain whether the upload intent, signed binary upload or draft attach step failed.

## 2. Acceptance Criteria

- [x] Add a composed pet media upload+attach flow in `@pic4paws/client`.
- [x] The flow accepts injected upload client, attach client and media ID generator.
- [x] The flow builds a `pet_public_image` / `public` upload request from pet draft context and file metadata.
- [x] The flow calls attach only after upload succeeds.
- [x] Upload intent failures are returned as an `upload_intent` phase.
- [x] Signed binary upload failures are returned as a `binary_upload` phase.
- [x] Attach failures are returned as an `attach` phase.
- [x] Success returns safe upload and attached draft metadata.
- [x] Results never expose signed URLs, bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Tests fail before implementation and pass after the flow is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not wire Web or Mobile UI to this composed flow yet.
- Do not add real file picker integration.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement retries, progress or post-upload image processing.

## 4. Completion Notes

Implemented on `codex/PET-MEDIA-UPLOAD-ATTACH-FLOW-001`, stacked on `codex/PET-MEDIA-ATTACH-CLIENT-001`.

- Added `createPetMediaUploadAttachFlowClient` to `@pic4paws/client`.
- Added typed file input, success result and phase-specific failure result models.
- Composed injected upload and attach clients with injected media ID generation.
- Preserved safe failure phases for upload intent, binary upload and draft attach.
- Added tests proving attach is not attempted after upload failures.
- Validation passed: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
