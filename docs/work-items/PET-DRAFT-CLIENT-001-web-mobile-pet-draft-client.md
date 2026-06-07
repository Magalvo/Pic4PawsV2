# Work-Item: PET-DRAFT-CLIENT-001-Web Mobile Pet Draft Client

## 1. Context & Problem

`PET-WORKER-001` added authenticated Worker routes for creating and updating pet drafts:

- `POST /pets/drafts`
- `PATCH /pets/drafts/:petId`

Web and Mobile still need a shared safe client wrapper for these routes. The client must keep server-side validation authoritative, use injected dependencies for auth and transport, and avoid forwarding client-only or credential-like fields.

## 2. Acceptance Criteria

- [x] Add a Web/Mobile-safe pet draft client in `@pic4paws/client`.
- [x] The client calls `POST /pets/drafts` to create drafts under the configured pet drafts base path.
- [x] The client calls `PATCH /pets/drafts/:petId` to update drafts under the configured pet drafts base path.
- [x] The client requires an injected bearer token provider and rejects missing tokens before network calls.
- [x] The client sends only the safe pet draft payload expected by the Worker.
- [x] Success returns safe `petId` metadata for create and update operations.
- [x] Worker unauthenticated, unauthorized, invalid draft and missing adapter responses map to deterministic safe client failures.
- [x] Malformed or non-JSON Worker responses map to `worker_request_failed`.
- [x] Client-facing results never expose bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Tests fail before implementation and pass after the client is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile draft editor UI.
- Do not connect production auth/session state.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement publish or media attach behavior.
- Do not move server-side draft validation into the client.

## 4. Completion Notes

Implemented on branch `codex/PET-DRAFT-CLIENT-001`.

The shared `@pic4paws/client` package now exposes `createPetDraftClient`, which creates and updates pet drafts through the authenticated Worker draft routes with injected `fetch` and bearer token provider, sends only the Worker-safe draft payload, and normalizes/sanitizes Worker failures.

Validation passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
