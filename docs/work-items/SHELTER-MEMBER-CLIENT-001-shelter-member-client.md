# Work-Item: SHELTER-MEMBER-CLIENT-001 — Shelter Member Client

## 1. Context & Problem

`SHELTER-MEMBER-WORKER-001` added `GET/POST /shelters/:shelterId/members` and
`DELETE /shelters/:shelterId/members/:memberId` to the Worker.

Web and Mobile product boundaries need a single, platform-neutral client that wraps all
three operations. Without it, each platform reimplements HTTP wiring, token injection,
and failure classification for every member management action.

## 2. Acceptance Criteria

- [x] `createShelterMemberClient({ workerBaseUrl, sheltersPath, getAccessToken, fetch })` added to `@pic4paws/client`.
- [x] Three methods exported: `loadShelterMembers(shelterId, query?)`, `addShelterMember(shelterId, input)`, `removeShelterMember(shelterId, memberId)`.
- [x] `loadShelterMembers` returns paginated member list; supports `limit`/`offset` query params.
- [x] `addShelterMember` maps 409 worker response to `member_already_exists` failure status.
- [x] `removeShelterMember` maps 404 worker response to `member_not_found` failure status.
- [x] Shared failure statuses: `unauthenticated | forbidden | shelter_not_found | invalid_member_role | worker_request_failed | worker_response_invalid`.
- [x] Bearer token injected from `getAccessToken` for all three methods.
- [x] Response never surfaces raw error messages, user IDs, or server internals.
- [x] 12 tests covering all operations and failure branches.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile UI boundaries (separate work items).
- Do not call Supabase directly from the client.

## 4. Completion Notes

Implemented on branch `agent/SHELTER-MEMBER-CLIENT-001`. Merged as PR #86.
