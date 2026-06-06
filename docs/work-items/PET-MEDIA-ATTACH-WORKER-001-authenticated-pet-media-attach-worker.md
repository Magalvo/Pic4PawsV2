# Work-Item: PET-MEDIA-ATTACH-WORKER-001-Authenticated Pet Media Attach Worker

## 1. Context & Problem

`PET-MEDIA-UPLOAD-UI-001` returns the next action `Associar imagem ao rascunho` after a safe Web/Mobile image upload. The backend still needs an authenticated Worker boundary that attaches a persisted public image media asset to a pet draft.

The domain already owns the attachment rules through `attachMediaAssetToPetDraft`. This item exposes those rules through an injectable Worker boundary and Supabase adapter without trusting client-side draft state.

## 2. Acceptance Criteria

- [x] Add a `POST /pets/drafts/:petId/media` Worker route under the configured pet drafts path.
- [x] Parse a minimal payload containing `mediaId`.
- [x] Authenticate the actor with the existing pet draft authenticator.
- [x] Load the persisted pet draft and persisted media asset through an injected repository.
- [x] Authorize only actors that can manage the pet draft shelter.
- [x] Reuse `attachMediaAssetToPetDraft` for non-draft, deleted, private, cross-shelter and duplicate media rules.
- [x] Persist the updated draft media IDs and hero media ID through an injected repository.
- [x] Add a Supabase repository adapter for loading attach context and persisting the attachment.
- [x] Return safe API responses without signed URLs, bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Tests fail before implementation and pass after the Worker boundary is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile UI wiring for the attach action.
- Do not re-upload or transform media.
- Do not trust client-supplied pet draft media arrays.
- Do not call real Supabase, R2 or Worker services in tests.
- Do not implement post-upload processing or moderation.

## 4. Completion Notes

Implemented on `codex/PET-MEDIA-ATTACH-WORKER-001`.

- Added `POST /pets/drafts/:petId/media` as an authenticated Worker route.
- Added `PetMediaAttachRepository` and injected it through Worker dependencies.
- Reused `attachMediaAssetToPetDraft` for draft/media validation.
- Added Supabase adapter support for loading attach context and persisting `media_ids` / `hero_media_id`.
- Added boundary and Supabase adapter tests with safe response assertions.
- Validation passed: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
