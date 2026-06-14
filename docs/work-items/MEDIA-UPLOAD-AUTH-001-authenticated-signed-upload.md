# Work-Item: MEDIA-UPLOAD-AUTH-001-Authenticated Signed Upload

## Goal

Signed media upload URLs must never be issued to unauthenticated requests. Dry-run upload metadata without a signed URL is allowed only in explicitly non-production environments.

## States

- `unauthenticated`: request lacks a valid bearer token and cannot receive `upload_ready`.
- `auth_adapter_missing`: request has a bearer token but the worker cannot resolve an actor.
- `signed_upload_ready`: authenticated actor receives a signed URL from the configured signer.
- `dry_run_non_production`: development/preview can return `upload_signer_not_configured` metadata without a signed URL.
- `signer_missing_production`: production rejects unsigned dry-runs with an operational error.

## Contract

- Any response with `status: upload_ready` and a non-null `signedUrl` requires an authenticated actor.
- The signer must not be called before authentication succeeds.
- Production media upload requests without a signer must return `upload_signer_not_configured` instead of dry-run upload metadata.
- Development/preview may keep dry-run metadata to support local contract testing.
- Existing repository persistence must continue to authorize the actor against the media scope before saving.

## Affected files

- `apps/workers/src/routes/media.ts`
- `apps/workers/src/media-upload.ts`
- `tests/workers/media-upload-boundary.test.ts`
- `tests/workers/media-upload-signer.test.ts`
- `tests/workers/media-upload-persistence.test.ts`
