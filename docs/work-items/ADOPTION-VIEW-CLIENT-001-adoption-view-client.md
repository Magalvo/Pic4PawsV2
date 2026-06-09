# Work-Item: ADOPTION-VIEW-CLIENT-001 — Adoption View Client

## 1. Context & Problem

`ADOPTION-VIEW-WORKER-001` added `GET /adoptions/:applicationId` to the Worker.

Web and Mobile product boundaries need a shared, platform-neutral client to call this route.
Without it, each platform would re-implement HTTP wiring, token injection, and failure
classification independently.

## 2. Acceptance Criteria

- [x] `createAdoptionViewClient({ workerBaseUrl, adoptionsPath, getAccessToken, fetch })` added to `@pic4paws/client`.
- [x] Exported method: `loadAdoptionView(applicationId)` → adoption application data.
- [x] 7 failure statuses mapped: `unauthenticated | forbidden | adoption_not_found | worker_request_failed | worker_response_invalid | network_error | unknown`.
- [x] Bearer token injected from `getAccessToken`; 401 worker response maps to `unauthenticated`.
- [x] 403 worker response maps to `forbidden`.
- [x] 404 worker response maps to `adoption_not_found`.
- [x] Malformed or unexpected 200 body maps to `worker_response_invalid`.
- [x] Network/fetch failures map to `worker_request_failed`.
- [x] Response never surfaces raw error messages or server internals.
- [x] 9 tests covering all failure branches.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile UI boundaries (separate work items).
- Do not call Supabase or R2 directly from the client.

## 4. Completion Notes

Implemented on branch `agent/ADOPTION-VIEW-CLIENT-001`. Merged as PR #81.
