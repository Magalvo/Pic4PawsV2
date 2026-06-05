# Work-Item: PET-WORKER-001-Authenticated Pet Draft Worker Contract

## 1. Context & Problem

`PET-DB-001` added pure database contracts for creating and updating pet drafts. The next backend boundary is a Worker request contract that can accept authenticated pet draft requests, authorize shelter management and call injectable persistence without connecting to Supabase or implementing client UI.

This keeps the app moving toward real pet creation while preserving the current architecture rule: external services and persistence adapters must remain injectable and testable.

## 2. Acceptance Criteria

- [x] Environment config exposes a validated pet drafts Worker path.
- [x] `POST /pets/drafts` creates pet draft persistence contracts through an injected repository.
- [x] `PATCH /pets/drafts/:petId` updates pet draft persistence contracts through an injected repository.
- [x] Requests require an authenticated actor resolved through an injected authenticator.
- [x] Actors can manage only shelters they are authorized for; unauthorized actors receive safe `403` responses.
- [x] Attached media is loaded through the injected repository and validated by the database pet draft contract.
- [x] Missing auth or persistence adapters return explicit safe `501` responses without leaking secrets.
- [x] Invalid JSON or invalid pet draft payloads return deterministic safe errors.
- [x] Tests fail before implementation and pass after the Worker contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Supabase.
- Do not implement client UI.
- Do not publish pets.
- Do not create live database mutations outside injected test adapters.
- Do not design adoption application flows.

## 4. Completion Notes

- Added `WORKER_PET_DRAFTS_PATH` with default `/pets/drafts`.
- Added authenticated Worker pet draft create/update request handling with injectable auth and repository dependencies.
- Pet draft media loading and persistence use `@pic4paws/database` contracts without Supabase access.
- Missing adapters, unauthenticated actors, unauthorized actors, invalid JSON and invalid draft contracts return safe deterministic responses.
- No UI, live Supabase writes or pet publishing route were added.
