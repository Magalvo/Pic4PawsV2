# Work-Item: PET-MEDIA-UPLOAD-UI-001-Pet Media Product Upload Flow

## 1. Context & Problem

Web and Mobile now have safe media upload boundaries over the shared composed upload flow. The product still needs a pet-facing upload UI contract so shelters can add a public image to a pet draft without exposing signed URLs, provider credentials or service-role secrets to UI state.

This item connects the existing safe boundaries to a first product-level pet media upload flow with injected dependencies and deterministic tests. It stops before real file pickers, real authenticated sessions, draft attachment persistence and post-upload processing.

## 2. Acceptance Criteria

- [x] Create a Web pet media upload UI flow that consumes the existing Web media upload boundary.
- [x] Create a Mobile pet media upload UI flow that consumes the existing Mobile media upload boundary.
- [x] Expose PT-PT product copy for ready, choosing, uploading, uploaded and failed states.
- [x] Build `pet_public_image` uploads from pet draft context and selected image file metadata.
- [x] Generate media IDs through an injected function, not random global state in tests.
- [x] Reject unsupported image MIME types before calling the upload boundary.
- [x] Return safe product view models for success and failure without signed URLs or provider credentials.
- [x] Keep post-upload draft attachment as a next action only; do not persist pet media attachment here.
- [x] Tests fail before implementation and pass after the UI flow is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement real Web file input handling.
- Do not implement native Mobile image picker wiring.
- Do not connect real auth sessions.
- Do not call real Supabase, R2 or Worker services in tests.
- Do not attach uploaded media to the pet draft database record.
- Do not add upload progress, image transforms or post-upload processing.

## 4. Completion Notes

Implemented on `codex/PET-MEDIA-UPLOAD-UI-001`.

- Added Web and Mobile product UI flow modules for pet image upload.
- Added deterministic media ID generation through injected functions.
- Added MIME type guard before upload boundary calls.
- Added safe PT-PT product view models for ready, uploaded and failed states.
- Added foundation screen copy for the pet media product flow.
- Left draft media attachment as the explicit next action; no persistence was added here.
- Validation passed: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
