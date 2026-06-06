# Work-Item: MOBILE-PET-MEDIA-UPLOAD-ATTACH-001-Mobile Pet Media Upload Attach Product Flow

## 1. Context & Problem

`PET-MEDIA-UPLOAD-ATTACH-FLOW-001` added a shared composed client flow that uploads a public pet image and attaches the persisted media asset to a pet draft. `WEB-PET-MEDIA-UPLOAD-ATTACH-001` already consumes that flow in the Web product boundary.

The Mobile product boundary still exposes the older upload-only result with deterministic media ID generation and a `nextAction` to attach the image later.

The Mobile product boundary should now consume the composed flow through injected dependencies and return UI-safe PT-PT view models for the complete upload+attach path.

## 2. Acceptance Criteria

- [x] Update the Mobile pet media product flow to consume an injected composed upload+attach flow.
- [x] Remove Mobile product-boundary media ID generation from this flow.
- [x] Keep selected file validation in the Mobile boundary before calling the composed flow.
- [x] Success returns PT-PT copy confirming the image was uploaded and attached to the draft.
- [x] Success exposes safe media metadata and attached draft media state.
- [x] Upload intent failures map to a safe Mobile product failure state.
- [x] Binary upload failures map to a safe Mobile product failure state.
- [x] Attach failures map to a safe Mobile product failure state.
- [x] Unsupported MIME types are rejected before calling the composed flow.
- [x] UI-facing results never expose signed URLs, bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Tests fail before implementation and pass after the Mobile product boundary is updated.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not wire real native file pickers.
- Do not connect production auth/session state.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement retries, upload progress or image processing.
- Do not update Web in this work item.

## 4. Completion Notes

Implemented on branch `codex/MOBILE-PET-MEDIA-UPLOAD-ATTACH-001`.

The Mobile pet media product boundary now consumes an injected composed upload+attach flow, keeps MIME validation before the service call, maps upload intent, binary upload and attach failures to safe PT-PT UI states, and returns draft media attachment state on success.

Validation passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
