# Work-Item: MEDIA-WORKER-PERSIST-001-Authenticated Media Asset Worker Persistence

## 1. Context & Problem

`MEDIA-DB-001` defined how signed upload intents become `media_assets` insert contracts, and `R2-SIGNER-SDK-001` added a real server-side R2 upload signer. The Worker media upload route can now return signed upload URLs, but it still does not persist a media asset record through a repository boundary.

This item wires signed media upload intents into authenticated Worker persistence. The route must keep explicit dependency injection for tests, must not persist signed URLs or expiry values, and must authorize the actor against the requested owner/shelter scope before saving a `media_assets` insert contract.

## 2. Acceptance Criteria

- [x] A typed Worker media asset repository interface exists for saving `MediaAssetInsertContract` records.
- [x] The media upload route can authenticate the actor before persistence using the existing Worker authenticator boundary.
- [x] Signed upload intents are mapped to `MediaAssetInsertContract` through `createMediaAssetInsertFromUploadIntent`.
- [x] Persisted records never include signed URLs, signer expiry values or R2 credentials.
- [x] Shelter-scoped uploads require an actor that can manage the shelter; user-scoped uploads require the same actor user id or admin role.
- [x] Repository failures return sanitized responses without leaking database, Supabase, R2 or bearer-token details.
- [x] Without a repository dependency, the existing signed/no-signer upload responses keep working.
- [x] Tests use injected auth, signer and repository fakes and do not connect to Supabase or Cloudflare.
- [x] Tests fail before implementation and pass after implementation.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not upload files to R2.
- Do not call Cloudflare APIs in tests.
- Do not create a client upload UI.
- Do not add image processing or derivative generation.
- Do not change the existing database schema.

## 4. Completion Notes

- Added a typed `MediaAssetRepository` boundary and persistence helper for signed Worker media upload intents.
- Updated the media upload route to authenticate, authorize and persist when a repository dependency is present.
- Added Supabase-backed `media_assets` insert mapping through the existing Worker Supabase repository composition.
- Kept existing signed/no-signer upload behavior available when no repository is injected.
- Verified repository payloads omit signed URLs, signer expiry values and temporary URL secrets.
- Validation passed on 2026-06-05: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
