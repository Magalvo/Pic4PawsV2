# Work-Spec: Implementation Plan for MEDIA-DB-001

## 1. Target Files

- `docs/work-items/MEDIA-DB-001-media-asset-persistence-contract.md`
- `docs/work-specs/MEDIA-DB-001-media-asset-persistence-contract.md`
- `packages/database/src/media-assets.ts`
- `packages/database/src/index.ts`
- `apps/workers/src/media-upload.ts`
- `tests/database/media-asset-persistence.test.ts`
- `tests/workers/media-upload-boundary.test.ts`
- `tests/workers/media-upload-signer.test.ts`

## 2. Proposed Technical Approach

Add a side-effect-free database helper that accepts the approved signed upload intent shape and returns a deterministic `media_assets` insert contract. The Worker upload intent should expose ownership and media kind metadata already known from the media policy, so future persistence adapters do not need to reconstruct that state from request payloads.

Expose:

- `createMediaAssetInsertFromUploadIntent`
- `MediaAssetInsertContract`

## 3. Testing Strategy

- Initial failing test: assert signed upload intents produce insert contracts, signed URLs are omitted, unsigned intents are rejected and missing scope is rejected.
- Expected input data: signed Worker upload intent with fake signer and direct unsigned fixture.
- Expected output/behavior: deterministic insert object only; no database writes.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No live database access.
- No Supabase client introduced.
- No signed URL persistence.
- No real media file processing.
