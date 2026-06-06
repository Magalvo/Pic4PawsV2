# Work-Spec: Implementation Plan for MEDIA-UPLOAD-FLOW-CLIENT-001

## 1. Target Files

- `docs/work-items/MEDIA-UPLOAD-FLOW-CLIENT-001-composed-media-upload-client-flow.md`
- `docs/work-specs/MEDIA-UPLOAD-FLOW-CLIENT-001-composed-media-upload-client-flow.md`
- `packages/client/src/index.ts`
- `tests/client/media-upload-flow-client.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Extend `@pic4paws/client` with a composed upload flow factory:

- `createMediaUploadFlowClient`
- `MediaUploadFlowClient`
- `UploadMediaFlowInput`
- `UploadMediaFlowResult`

The flow will reuse the existing primitives:

- `createMediaUploadClient` for authenticated Worker intent requests
- `createMediaUploadBinaryClient` for signed URL byte upload

The flow input will include:

- `request: MediaUploadClientRequest`
- `body: BodyInit`

The flow will use `request.mimeType` and `request.byteSize` when calling the binary upload executor so that caller-visible file metadata and signed intent metadata stay aligned.

## 3. Testing Strategy

- Initial failing test: import `createMediaUploadFlowClient` and assert the full Worker intent + signed URL upload sequence.
- Assert Worker intent failures stop before signed URL upload and return `phase: intent`.
- Assert signed URL upload failures return `phase: binary_upload`.
- Assert signed URL upload requests never include bearer tokens.
- Assert flow results do not leak service-role keys, R2 credentials or provider debug details.

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
- No progress/retry behavior until a dedicated work item defines it.

## 6. Implementation Notes

Implemented `createMediaUploadFlowClient` in `@pic4paws/client`.

The flow:

- reuses the authenticated Worker intent client
- reuses the signed URL binary upload executor
- uses the request MIME type and byte size when uploading bytes
- stops before binary upload when intent creation fails
- returns `phase: intent` for Worker-side request failures
- returns `phase: binary_upload` for signed URL upload failures
- returns safe intent metadata on success without exposing signed URLs, bearer tokens or provider credentials

The next step should integrate this flow into one Web or Mobile surface with fake/injected upload dependencies first, before real user-facing media management behavior expands.
