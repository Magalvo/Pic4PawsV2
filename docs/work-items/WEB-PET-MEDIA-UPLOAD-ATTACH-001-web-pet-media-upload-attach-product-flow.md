# Work-Item: WEB-PET-MEDIA-UPLOAD-ATTACH-001-Web Pet Media Upload Attach Product Flow

## 1. Context & Problem

`PET-MEDIA-UPLOAD-ATTACH-FLOW-001` added a shared composed client flow that uploads a public pet image and then attaches the persisted media asset to a pet draft. The Web product boundary still exposes the older upload-only result with the next action `Associar imagem ao rascunho`.

The Web product boundary should now consume the composed flow through injected dependencies and return UI-safe PT-PT view models for the complete upload+attach path.

## 2. Acceptance Criteria

- [x] Update the Web pet media product flow to consume an injected composed upload+attach flow.
- [x] Keep selected file validation in the Web boundary before calling the composed flow.
- [x] Success returns PT-PT copy confirming the image was uploaded and attached to the draft.
- [x] Success exposes safe media metadata and attached draft media state.
- [x] Upload intent failures map to a safe Web product failure state.
- [x] Binary upload failures map to a safe Web product failure state.
- [x] Attach failures map to a safe Web product failure state.
- [x] Unsupported MIME types are rejected before calling the composed flow.
- [x] UI-facing results never expose signed URLs, bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Tests fail before implementation and pass after the Web product boundary is updated.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not wire real browser file inputs.
- Do not connect production auth/session state.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement retries, progress or image processing.
- Do not update Mobile in this work item.

## 4. Completion Notes

Implemented on branch `codex/WEB-PET-MEDIA-UPLOAD-ATTACH-001`.

The Web pet media product boundary now consumes an injected composed upload+attach flow, keeps MIME validation before the service call, maps upload intent, binary upload and attach failures to safe PT-PT UI states, and returns draft media attachment state on success.

Validation passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
