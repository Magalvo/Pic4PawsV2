# Work-Spec: Implementation Plan for MEDIA-UPLOAD-BINARY-CLIENT-001

## 1. Target Files

- `docs/work-items/MEDIA-UPLOAD-BINARY-CLIENT-001-browser-mobile-safe-binary-upload-executor.md`
- `docs/work-specs/MEDIA-UPLOAD-BINARY-CLIENT-001-browser-mobile-safe-binary-upload-executor.md`
- `packages/client/src/index.ts`
- `tests/client/media-upload-binary-client.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Extend `@pic4paws/client` with a binary media upload executor factory accepting injected `fetch`.

Expose:

- `createMediaUploadBinaryClient`
- `MediaUploadBinaryClient`
- `UploadMediaBinaryInput`
- `UploadMediaBinaryResult`

The executor will:

- accept a `MediaUploadClientIntent`
- require `status: upload_ready`, `dryRunOnly: false` and a non-empty `signedUrl`
- require caller-provided `contentType` and `byteSize` to match the signed intent
- upload the provided `BodyInit` to the signed URL
- default to `PUT` and `Content-Type: intent.contentType`
- support future Worker-provided optional `uploadMethod` and `uploadHeaders` without accepting arbitrary caller headers
- strip sensitive upload headers such as `Authorization`
- normalize non-2xx signed upload responses into safe errors

## 3. Testing Strategy

- Initial failing test: import `createMediaUploadBinaryClient` and assert signed URL upload shape.
- Assert dry-run/signer-not-configured intent prevents `fetch`.
- Assert MIME type and byte size mismatches prevent `fetch`.
- Assert failed signed upload responses are normalized safely and provider debug text is not returned.
- Assert upload requests never include bearer tokens, Supabase service-role keys or R2 credentials.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Supabase SDK.
- No R2 SDK.
- No UI.
- No client-side service-role or R2 credential fields.
- No persistence writes from the client.
- No upload progress/retry complexity until a dedicated work item exists.

## 6. Implementation Notes

Implemented `createMediaUploadBinaryClient` in `@pic4paws/client`.

The executor:

- requires an `upload_ready` intent with `dryRunOnly: false`
- rejects missing signed URLs before calling `fetch`
- requires caller-provided MIME type and byte size to match the signed intent
- defaults to `PUT` and `Content-Type: intent.contentType`
- supports future optional `uploadMethod` and `uploadHeaders` fields on the intent
- strips sensitive headers such as `Authorization`, R2 secret/access-key headers and Supabase service-role headers
- returns safe result objects for successful uploads, rejected signed uploads and network errors

The next client-side step should compose this executor with `requestMediaUploadIntent` into a single tested media upload flow before UI integration.
