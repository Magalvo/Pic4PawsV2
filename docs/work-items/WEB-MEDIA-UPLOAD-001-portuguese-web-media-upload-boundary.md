# Work-Item: WEB-MEDIA-UPLOAD-001-Portuguese Web Media Upload Boundary

## 1. Context & Problem

`MEDIA-UPLOAD-FLOW-CLIENT-001` completed the shared client flow that requests a Worker upload intent and uploads bytes to the signed URL. The Web app now needs its first Portuguese-first integration boundary for that flow.

The Web layer must keep credentials and external services injectable so tests can exercise upload states without real Supabase, R2 or Worker calls. This item introduces a small Web-facing boundary for public pet image uploads and surfaces safe PT-PT upload states.

This item stops before real UI file pickers, routes, authenticated sessions and production credentials.

## 2. Acceptance Criteria

- [x] `@pic4paws/web` depends on the shared `@pic4paws/client` package.
- [x] The Web app exposes a media upload boundary with injected `fetch` and bearer token provider.
- [x] The boundary builds a `pet_public_image` upload request from Web file metadata.
- [x] The boundary calls the composed media upload flow and returns PT-PT states for idle, uploading, uploaded, intent failure and binary upload failure.
- [x] The Web layer never sends bearer tokens to signed upload URLs.
- [x] The Web result never exposes signed URLs, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] The foundation page surfaces the media upload capability as contract-ready copy without real service calls.
- [x] Tests fail before implementation and pass after the Web boundary is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement a real file picker.
- Do not connect browser auth sessions.
- Do not call real Supabase, R2 or Worker services in tests.
- Do not add upload progress, retries or image transforms.
- Do not implement post-upload media confirmation.
- Do not expose Supabase service-role keys, R2 access keys or R2 secret keys.

## 4. Completion Notes

Completed in branch `codex/WEB-MEDIA-UPLOAD-001`.

Implemented `createWebMediaUploadBoundary` in `@pic4paws/web` with injected `fetch` and bearer token provider. The boundary maps Web file metadata into a `pet_public_image` upload request, calls the composed shared upload flow and returns safe PT-PT states.

The foundation page now surfaces the media upload capability as contract-ready copy only. It does not include a real file picker or real service calls.

Validation completed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
