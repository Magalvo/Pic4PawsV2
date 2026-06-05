# Work-Spec: Implementation Plan for MEDIA-UPLOAD-CLIENT-001

## 1. Target Files

- `docs/work-items/MEDIA-UPLOAD-CLIENT-001-web-mobile-media-upload-client-contract.md`
- `docs/work-specs/MEDIA-UPLOAD-CLIENT-001-web-mobile-media-upload-client-contract.md`
- `packages/client/package.json`
- `packages/client/tsconfig.json`
- `packages/client/src/index.ts`
- `tests/client/media-upload-client.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Create `@pic4paws/client` as a platform-neutral package with a media upload client factory accepting:

- `workerBaseUrl`
- `mediaUploadPath`
- injected `fetch`
- injected `getAccessToken`

Expose:

- `createMediaUploadClient`
- `MediaUploadClientRequest`
- `RequestMediaUploadIntentResult`

The client will select only known upload request fields, attach `Authorization: Bearer <user-token>`, parse JSON responses and return safe typed results.

## 3. Testing Strategy

- Initial failing test: import `createMediaUploadClient` and assert the POST request shape.
- Assert missing access token prevents `fetch`.
- Assert extra secret-like input fields are not serialized.
- Assert success and failure Worker responses are normalized safely.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Supabase SDK.
- No R2 SDK.
- No UI.
- No binary upload.
- No client-side service-role or R2 credential fields.

## 6. Implementation Notes

Implemented `@pic4paws/client` with a narrow media upload intent contract shared by Web/Mobile.

The client:

- rejects missing user access tokens before calling the Worker
- sends only `Authorization: Bearer <user-token>` and JSON request fields allowed by the media upload contract
- normalizes `upload_ready` and `upload_signer_not_configured` into typed upload intent success results
- normalizes known Worker failures into safe client failures without exposing internal debug details or secret-like fields

Binary file transfer to the signed upload URL remains intentionally out of scope for the next work item.
