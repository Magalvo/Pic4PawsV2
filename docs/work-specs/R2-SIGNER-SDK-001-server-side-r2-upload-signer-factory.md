# Work-Spec: Implementation Plan for R2-SIGNER-SDK-001

## 1. Target Files

- `docs/work-items/R2-SIGNER-SDK-001-server-side-r2-upload-signer-factory.md`
- `docs/work-specs/R2-SIGNER-SDK-001-server-side-r2-upload-signer-factory.md`
- `apps/workers/package.json`
- `apps/workers/src/r2-signer.ts`
- `apps/workers/src/index.ts`
- `tests/workers/r2-signer-factory.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Install AWS S3-compatible signing packages in the Workers workspace and keep them isolated from shared domain/config packages. Add an adapter module that exposes:

- `createR2UploadSigner`
- `createR2UploadSignerWorkerDependencies`
- `R2UploadSignerFactoryError`

`createR2UploadSigner` returns the existing `MediaUploadSigner` contract. Its default presigner constructs a Cloudflare R2 S3-compatible client using:

- endpoint `https://<accountId>.r2.cloudflarestorage.com`
- region `auto`
- configured R2 access key id
- configured R2 secret access key
- path-style bucket addressing

Tests inject a fake presigner so no network, Cloudflare API, R2 upload or real credentials are used.

The default Worker export should compose both the Supabase SDK dependency factory and the R2 signer when environment parsing succeeds. Explicit dependency injection remains supported for tests.

## 3. Testing Strategy

- Initial failing test: import the R2 signer factory and assert a fake presigner receives endpoint, credentials, bucket/key/content metadata and expiry.
- Assert the signer returns a signed URL and deterministic `expiresAt`.
- Assert failures are sanitized and do not leak R2 secrets or provider payloads.
- Assert default Worker dependency composition can return a media upload signer.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No live Cloudflare calls in tests.
- No R2 uploads.
- R2 credentials stay in Worker-only runtime composition.
- Short-lived upload URLs only.
- Signer errors are sanitized before crossing boundaries.
