# Work-Item: R2-SIGNER-SDK-001-Server-Side R2 Upload Signer Factory

## 1. Context & Problem

`SIGNER-001` added an injectable media upload signer boundary, but production still has no real Cloudflare R2-compatible signer behind it. Valid media upload requests can only return `upload_signer_not_configured`, which blocks real direct-to-R2 uploads.

This item adds a server-side R2 upload signer factory for the Workers app. It must use configured Cloudflare R2 credentials only inside Worker runtime code, generate short-lived PUT upload URLs, and remain fully testable through injected presigner functions without calling Cloudflare.

## 2. Acceptance Criteria

- [x] `@pic4paws/workers` depends on proven AWS S3-compatible signing packages for R2 presigned PUT URLs.
- [x] A server-side R2 signer factory returns the existing `MediaUploadSigner` contract.
- [x] The signer uses Cloudflare account id, R2 access key and R2 secret access key from parsed environment config.
- [x] The signer creates PUT upload URLs for the validated bucket name, object key and content type.
- [x] Signed upload expiry is bounded and reflected in `expiresAt`.
- [x] Default Worker `fetch` composes the R2 signer for media upload routes without removing explicit test dependency injection.
- [x] Signer factory failures throw sanitized errors without exposing R2 access keys, secret keys or provider payloads.
- [x] Tests inject a fake presigner function and do not connect to Cloudflare.
- [x] Tests fail before implementation and pass after implementation.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not upload files to R2.
- Do not call Cloudflare APIs in tests.
- Do not persist media assets to Supabase.
- Do not expose R2 credentials or signed URL internals to client-executed code.
- Do not implement image processing or media derivative generation.

## 4. Completion Notes

- Added AWS S3-compatible signing dependencies to `@pic4paws/workers` only.
- Added `apps/workers/src/r2-signer.ts` with an injectable Cloudflare R2 upload signer factory.
- Added default Worker dependency composition for R2 media upload signing when environment parsing succeeds.
- Kept tests offline through an injected fake presigner function.
- Verified sanitized signer errors do not leak R2 access keys, secret keys or provider payloads.
- Validation passed on 2026-06-05: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
