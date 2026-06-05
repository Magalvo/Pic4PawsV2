# Work-Spec: Implementation Plan for PET-WORKER-001

## 1. Target Files

- `docs/work-items/PET-WORKER-001-authenticated-pet-draft-worker-contract.md`
- `docs/work-specs/PET-WORKER-001-authenticated-pet-draft-worker-contract.md`
- `packages/config/src/env.ts`
- `apps/workers/src/pet-drafts.ts`
- `apps/workers/src/index.ts`
- `apps/workers/package.json`
- `apps/workers/tsconfig.json`
- `tests/workers/pet-draft-boundary.test.ts`
- `tests/config/environment-contracts.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Add a configurable `WORKER_PET_DRAFTS_PATH` with default `/pets/drafts`. Implement a Worker pet draft boundary module that:

- Parses create/update draft payloads into `PetDraftRecord`.
- Requires `Authorization: Bearer ...` and resolves the actor through an injected authenticator.
- Uses `canManageShelter` from the domain package for shelter authorization.
- Loads attached media through an injected repository before calling database persistence contracts.
- Persists through injected `createDraft` and `updateDraft` repository functions.

The route stays adapter-ready but side-effect-free unless tests or future infrastructure provide dependencies.

## 3. Testing Strategy

- Initial failing test: route config, missing adapter responses, successful create, successful update and authorization rejection.
- Assert repository calls receive the deterministic insert/update contracts from `@pic4paws/database`.
- Assert invalid media and malformed JSON return safe deterministic errors.
- Assert response bodies do not leak Supabase service keys, R2 secrets or bearer tokens.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Supabase client.
- No R2 access.
- No UI.
- Auth and persistence are injected interfaces.
- Payment webhook behavior remains untouched.
