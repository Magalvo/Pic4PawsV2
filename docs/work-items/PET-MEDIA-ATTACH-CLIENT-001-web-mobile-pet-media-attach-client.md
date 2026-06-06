# Work-Item: PET-MEDIA-ATTACH-CLIENT-001-Web Mobile Pet Media Attach Client

## 1. Context & Problem

`PET-MEDIA-ATTACH-WORKER-001` added the authenticated Worker route `POST /pets/drafts/:petId/media` to attach a persisted public image media asset to a pet draft. Web and Mobile now need a shared client contract to call that route after upload without duplicating auth, payload sanitization or response normalization.

The client must be platform-neutral, injectable and safe for browser/mobile use.

## 2. Acceptance Criteria

- [x] Add a shared `@pic4paws/client` pet media attach client.
- [x] The client builds `POST /pets/drafts/:petId/media` from `workerBaseUrl`, configured pet drafts path and `petId`.
- [x] The client sends only `{ mediaId }` in the request body.
- [x] The client uses an injected bearer token provider and `fetch`.
- [x] Missing bearer tokens are rejected before network calls.
- [x] Success responses are normalized to safe attached media metadata.
- [x] Failure responses are normalized for unauthenticated, unauthorized, not found, invalid payload, domain rejections and generic Worker failures.
- [x] Client results never expose signed URLs, bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Tests fail before implementation and pass after the client is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not wire Web or Mobile UI to this client yet.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement retry, progress or post-upload processing.
- Do not trust client-supplied media arrays beyond sending `mediaId` to the Worker.

## 4. Completion Notes

Implemented on `codex/PET-MEDIA-ATTACH-CLIENT-001`.

- Added `createPetMediaAttachClient` to `@pic4paws/client`.
- Added typed request, success and failure result models.
- Added safe URL construction for `POST /pets/drafts/:petId/media`.
- Added local missing-token rejection.
- Added payload sanitization so only `{ mediaId }` is sent.
- Added response normalization for success, authorization, not found, validation, domain rejection and generic Worker failures.
- Validation passed: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
