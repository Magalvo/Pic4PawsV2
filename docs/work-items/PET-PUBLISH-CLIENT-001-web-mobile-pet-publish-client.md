# Work-Item: PET-PUBLISH-CLIENT-001-Web Mobile Pet Publish Client

## 1. Context & Problem

`PET-PUBLISH-WORKER-001` added the authenticated Worker route `POST /pets/drafts/:petId/publish`. Publishing is intentionally server-authoritative: the Worker loads persisted pet draft state, attached media assets, shelter verification state and actor permissions before publishing.

Web and Mobile still need a shared safe client wrapper for this route. The client must not send or trust publish claims such as pet status, media validity, shelter verification or actor authorization.

## 2. Acceptance Criteria

- [x] Add a Web/Mobile-safe pet publish client in `@pic4paws/client`.
- [x] The client calls `POST /pets/drafts/:petId/publish` under the configured pet drafts base path.
- [x] The client requires an injected bearer token provider and rejects missing tokens before network calls.
- [x] The client accepts only the pet draft ID as publish input and sends no client-side publish claims.
- [x] Success returns safe `petId` and `publishedAt` metadata from the Worker.
- [x] Worker unauthenticated, unauthorized, missing draft, rejected publish and missing adapter responses map to deterministic safe client failures.
- [x] Malformed or non-JSON Worker responses map to `worker_request_failed`.
- [x] Client-facing results never expose bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] Tests fail before implementation and pass after the client is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile publish UI.
- Do not connect production auth/session state.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement draft editing or media attachment behavior.
- Do not move server-side publish rules into the client.

## 4. Completion Notes

Implemented on branch `codex/PET-PUBLISH-CLIENT-001`.

The shared `@pic4paws/client` package now exposes `createPetPublishClient`, which calls the authenticated Worker publish route with injected `fetch` and bearer token provider, sends only an empty JSON body, returns safe publish metadata on success, and normalizes/sanitizes Worker failures.

Validation passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
