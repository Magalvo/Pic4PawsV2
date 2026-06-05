# Work-Spec: Implementation Plan for PET-PUBLISH-WORKER-001

## 1. Target Files

- `docs/work-items/PET-PUBLISH-WORKER-001-authenticated-pet-publish-worker-contract.md`
- `docs/work-specs/PET-PUBLISH-WORKER-001-authenticated-pet-publish-worker-contract.md`
- `apps/workers/src/pet-drafts.ts`
- `apps/workers/src/index.ts`
- `tests/workers/pet-publish-boundary.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Extend the existing pet drafts Worker route matcher to recognize `POST /pets/drafts/:petId/publish`. Add an injectable publish repository that can load the persisted publish context and persist the published pet result.

Use the existing `WorkerPetDraftAuthenticator` and the domain `publishPetDraft` helper. The Worker should:

- Parse bearer auth before loading publish context.
- Return `501` when auth or publish repository adapters are missing.
- Return `404` for missing publish context.
- Return `400` with domain reasons for invalid publish attempts.
- Return `200` only after the injected repository persists the successful published pet result.

## 3. Testing Strategy

- Initial failing test: route returns `404` before implementation.
- Assert successful publish passes a deterministic published pet into the repository.
- Assert missing adapters, missing auth, missing draft and domain publish failures are safe and deterministic.
- Assert no response body leaks bearer tokens or configured secrets.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Supabase client.
- No R2 access.
- No UI.
- Domain publishing validation remains the source of truth.
- Publish repository is injectable and side-effect-free in tests.
