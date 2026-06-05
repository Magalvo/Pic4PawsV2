# Work-Item: MEDIA-UPLOAD-CLIENT-001-Web/Mobile Media Upload Client Contract

## 1. Context & Problem

`MEDIA-WORKER-PERSIST-001` completed authenticated Worker media upload intent creation, signing and `media_assets` persistence. Web and mobile now need a shared client-side contract for requesting those upload intents without ever receiving or storing Supabase service-role keys, R2 access keys or direct server credentials.

This item defines a reusable platform-neutral client contract. It stops before UI and before binary upload to signed R2 URLs.

## 2. Acceptance Criteria

- [x] A shared `@pic4paws/client` package exposes a media upload client factory.
- [x] The client builds POST requests to the configured Worker media upload path.
- [x] The client sends only bearer user access tokens, never Supabase service-role keys or R2 credentials.
- [x] The request payload includes only allowed media upload request fields.
- [x] Missing user access tokens are rejected before any network request.
- [x] Worker success responses such as `upload_ready` are normalized into a typed upload intent result.
- [x] Worker failure responses such as `unauthenticated`, `actor_not_authorized` and `media_asset_persistence_failed` are normalized into safe client errors.
- [x] Tests fail before implementation and pass after the client contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement UI.
- Do not upload file bytes to R2.
- Do not add browser-side Supabase clients.
- Do not expose Supabase service-role keys, R2 access keys or R2 secret keys to Web/Mobile.
- Do not persist media assets from the client.

## 4. Completion Notes

Completed in branch `codex/MEDIA-UPLOAD-CLIENT-001`.

Implemented a platform-neutral `@pic4paws/client` package with `createMediaUploadClient`, injected `fetch`, injected bearer token provider, sanitized upload intent payloads and safe response normalization.

Validation completed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
