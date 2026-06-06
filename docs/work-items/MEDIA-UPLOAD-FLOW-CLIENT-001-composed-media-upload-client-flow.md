# Work-Item: MEDIA-UPLOAD-FLOW-CLIENT-001-Composed Media Upload Client Flow

## 1. Context & Problem

`MEDIA-UPLOAD-CLIENT-001` added a Web/Mobile-safe client for requesting authenticated media upload intents from the Worker. `MEDIA-UPLOAD-BINARY-CLIENT-001` added a Web/Mobile-safe executor for uploading bytes to a signed URL.

Web and Mobile now need a single shared flow that composes both steps while preserving typed partial-failure states. UI should be able to call one client method and distinguish whether failure happened while requesting the Worker intent or while uploading bytes to the signed URL.

This item defines the composed client flow only. It stops before UI, progress reporting, retries and post-upload confirmation.

## 2. Acceptance Criteria

- [x] `@pic4paws/client` exposes a composed media upload flow client factory.
- [x] The flow accepts a media upload request and binary body.
- [x] The flow requests an upload intent through the existing authenticated Worker client contract.
- [x] The flow uploads bytes through the existing signed URL binary executor only after intent creation succeeds.
- [x] Intent creation failures stop before signed URL upload and are returned with an `intent` phase.
- [x] Signed URL upload failures are returned with a `binary_upload` phase and safe error details.
- [x] Successful flows return the uploaded media id, object key, response status and safe intent metadata.
- [x] The flow never sends bearer tokens to signed upload URLs.
- [x] The flow never exposes Supabase service-role keys, R2 access keys or R2 secret keys in results.
- [x] Tests fail before implementation and pass after the flow client is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement UI.
- Do not add upload progress or retry policy.
- Do not persist media assets from the client.
- Do not add browser-side Supabase SDK or R2 SDK.
- Do not expose Supabase service-role keys, R2 access keys or R2 secret keys.
- Do not implement post-upload confirmation or media processing.

## 4. Completion Notes

Completed in branch `codex/MEDIA-UPLOAD-FLOW-CLIENT-001`.

Implemented `createMediaUploadFlowClient` in `@pic4paws/client`. The flow composes `requestMediaUploadIntent` with `uploadMediaBinary`, preserves distinct `intent` and `binary_upload` failure phases and returns safe intent metadata without signed URLs or provider secrets.

Validation completed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
