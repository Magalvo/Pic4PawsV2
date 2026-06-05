# Work-Item: PET-PUBLISH-WORKER-001-Authenticated Pet Publish Worker Contract

## 1. Context & Problem

`PET-WORKER-001` added authenticated Worker contracts for creating and updating pet drafts. The next backend boundary is publishing a persisted draft after loading its stored pet data, attached media assets and shelter verification status.

Publishing must remain driven by domain rules and server-side state. The Worker must not trust client claims about media validity, pet status, shelter verification or actor permissions.

## 2. Acceptance Criteria

- [x] `POST /pets/drafts/:petId/publish` is routed through the configured pet drafts base path.
- [x] Publishing requires an authenticated actor resolved through the injected authenticator.
- [x] The Worker loads pet draft, media assets and shelter verification status through an injected publish repository.
- [x] The Worker calls the domain publish contract and persists only successful published pets through the injected repository.
- [x] Unauthenticated, unauthorized, unverified shelter, non-draft and incomplete media/content cases return deterministic safe responses.
- [x] Missing auth or publish repository adapters return explicit safe `501` responses without leaking secrets.
- [x] Publishing responses do not leak bearer tokens, Supabase service role keys or R2 secrets.
- [x] Tests fail before implementation and pass after the Worker contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Supabase.
- Do not implement client UI.
- Do not mutate live records outside injected test adapters.
- Do not implement adoption application flows.
- Do not add payment or sponsorship behavior.

## 4. Completion Notes

- Added `POST /pets/drafts/:petId/publish` routing under the configured pet drafts path.
- Reused the injected Worker authenticator and added an injectable pet publish repository.
- Publishing now loads persisted publish context, runs domain `publishPetDraft` validation and persists only successful published records through the repository adapter.
- Missing auth/repository adapters, unauthenticated requests, missing drafts and domain publish failures return safe deterministic responses.
- No Supabase client, live database mutation, UI or payment behavior was added.
