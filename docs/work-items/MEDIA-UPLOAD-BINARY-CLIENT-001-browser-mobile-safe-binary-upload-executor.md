# Work-Item: MEDIA-UPLOAD-BINARY-CLIENT-001-Browser/Mobile Safe Binary Upload Executor

## 1. Context & Problem

`MEDIA-UPLOAD-CLIENT-001` added a shared Web/Mobile client contract for requesting authenticated media upload intents from the Worker. Those intents can include a signed upload URL generated server-side.

Web and Mobile now need a small platform-neutral executor that uploads bytes to the signed URL without receiving R2 access keys, Supabase service-role keys, persistence internals or any server-side credentials.

This item defines the binary upload executor only. It stops before UI, progress reporting, image processing and post-upload confirmation flows.

## 2. Acceptance Criteria

- [x] `@pic4paws/client` exposes a binary media upload executor factory.
- [x] The executor accepts a `MediaUploadClientIntent`, binary body, MIME type and byte size.
- [x] The executor rejects dry-run or signer-not-configured intents before any network request.
- [x] The executor rejects intents without a signed URL before any network request.
- [x] The executor rejects MIME type or byte size mismatches before any network request.
- [x] The executor uploads bytes directly to the signed URL with injected `fetch`.
- [x] The upload request uses the signed intent method/headers when present and otherwise defaults to signed `PUT` with the intent `Content-Type`.
- [x] The upload request never sends bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Signed URL upload failures are normalized into safe client errors without leaking provider debug details.
- [x] Tests fail before implementation and pass after the binary executor is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement UI.
- Do not request upload intents from this executor.
- Do not persist media assets from the client.
- Do not add Supabase SDK or R2 SDK to Web/Mobile.
- Do not expose or store Supabase service-role keys, R2 access keys or R2 secret keys.
- Do not implement upload progress, retries or image transforms yet.

## 4. Completion Notes

Completed in branch `codex/MEDIA-UPLOAD-BINARY-CLIENT-001`.

Implemented `createMediaUploadBinaryClient` in `@pic4paws/client` with injected `fetch`, pre-network intent/content validation, safe upload header filtering and safe signed upload failure normalization.

Validation completed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
