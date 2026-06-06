# Work-Item: MOBILE-MEDIA-UPLOAD-001-Portuguese Mobile Media Upload Boundary

## 1. Context & Problem

`WEB-MEDIA-UPLOAD-001` integrated the composed media upload flow into the Portuguese-first Web foundation with injected dependencies. Mobile needs the same safe boundary before real file pickers, native media libraries, authenticated sessions or production services are connected.

The Mobile layer must call the shared `@pic4paws/client` composed upload flow through injected dependencies and expose PT-PT upload states that can later be wired to Expo/React Native UI.

This item stops before real device media selection, upload progress, auth session wiring and post-upload confirmation.

## 2. Acceptance Criteria

- [x] `@pic4paws/mobile` depends on the shared `@pic4paws/client` package.
- [x] The Mobile app exposes a media upload boundary with injected `fetch` and bearer token provider.
- [x] The boundary builds a `pet_public_image` upload request from Mobile file metadata.
- [x] The boundary calls the composed media upload flow and returns PT-PT states for idle, uploading, uploaded, intent failure and binary upload failure.
- [x] The Mobile layer never sends bearer tokens to signed upload URLs.
- [x] The Mobile result never exposes signed URLs, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] The foundation screen surfaces the media upload capability as contract-ready copy without real service calls.
- [x] Tests fail before implementation and pass after the Mobile boundary is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement a real native file/image picker.
- Do not connect mobile auth sessions.
- Do not call real Supabase, R2 or Worker services in tests.
- Do not add upload progress, retries or image transforms.
- Do not implement post-upload media confirmation.
- Do not expose Supabase service-role keys, R2 access keys or R2 secret keys.

## 4. Completion Notes

Implemented on `codex/MOBILE-MEDIA-UPLOAD-001`.

- Added `apps/mobile/src/media-upload.ts` as the Mobile boundary over `createMediaUploadFlowClient`.
- Added PT-PT state copy for idle, uploading, uploaded, intent failure and binary upload failure.
- Added tests proving the Worker receives the bearer token while the signed upload URL does not.
- Added tests proving Mobile results do not expose signed URLs or server/provider credential markers.
- Surfaced the contract-ready media upload capability in the Mobile foundation screen.
- Validation passed: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
