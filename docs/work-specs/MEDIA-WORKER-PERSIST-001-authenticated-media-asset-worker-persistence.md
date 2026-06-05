# Work-Spec: Implementation Plan for MEDIA-WORKER-PERSIST-001

## 1. Target Files

- `docs/work-items/MEDIA-WORKER-PERSIST-001-authenticated-media-asset-worker-persistence.md`
- `docs/work-specs/MEDIA-WORKER-PERSIST-001-authenticated-media-asset-worker-persistence.md`
- `apps/workers/src/media-upload.ts`
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/pet-supabase.ts`
- `apps/workers/src/index.ts`
- `tests/workers/media-upload-persistence.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Extend the Worker media upload boundary with an optional repository dependency:

- `MediaAssetRepository`
- `saveMediaAsset(insert, actor)`

When `mediaAssetRepository` is absent, the existing upload behavior remains unchanged. When it is present, the media upload route must:

1. Parse and validate JSON as before.
2. Create a signed upload intent through the configured signer.
3. Authenticate the bearer token through the existing Worker authenticator boundary.
4. Authorize the actor against the upload scope.
5. Map the intent to a `MediaAssetInsertContract`.
6. Save it through the repository.
7. Return the signed upload response plus a non-secret persistence marker.

Add a Supabase-backed implementation to the existing Worker Supabase repository composition so production dependencies can persist media assets through the same server-side SDK client.

## 3. Testing Strategy

- Initial failing test: route-level test with injected signer/auth/repository should persist a signed media asset insert and keep the signed URL out of the repository payload.
- Assert repository persistence rejects unauthenticated requests.
- Assert actor authorization rejects cross-shelter or cross-user uploads.
- Assert repository failures return sanitized responses.
- Assert existing signed upload behavior remains available when no repository is injected.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No live Supabase or Cloudflare calls in tests.
- Signed URLs are returned to the caller but never persisted.
- Repository errors are sanitized.
- Existing explicit dependency injection remains the testing surface.
