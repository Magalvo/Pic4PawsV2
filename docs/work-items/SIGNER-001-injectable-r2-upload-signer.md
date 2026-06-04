# Work-Item: SIGNER-001-Injectable R2 Upload Signer

## 1. Context & Problem

`UPLOAD-001` validates media upload requests and maps them to R2 bucket/object metadata, but intentionally returns `signedUrl: null`. The next step is to define a signer interface that a future Cloudflare R2 adapter can implement, while keeping tests deterministic and avoiding real credentials.

## 2. Acceptance Criteria

- [x] A typed media upload signer interface exists and receives only bucket/key/content metadata needed for signing.
- [x] The Worker upload intent can use an injected signer to return `upload_ready` with a signed URL and expiry.
- [x] Without an injected signer, the Worker keeps returning `upload_signer_not_configured`.
- [x] Signer failures return a safe error response without leaking secrets or raw exception messages.
- [x] The Worker route supports dependency injection for tests without connecting to Cloudflare.
- [x] Tests fail before implementation and pass after the signer interface is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement AWS Signature V4 or real Cloudflare R2 signing.
- Do not add Cloudflare credentials.
- Do not call Cloudflare APIs.
- Do not upload files to R2.
- Do not persist media assets to Supabase.

## 4. Completion Notes

- Added a typed injectable media upload signer interface and signer input contract.
- Preserved the no-signer fallback as `upload_signer_not_configured`.
- Added signed upload response support with deterministic fake signer tests.
- Added safe signer failure handling that does not leak thrown exception messages.
- No real Cloudflare signer, credentials, API calls, uploads or database writes were added.
