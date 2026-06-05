# Work-Spec: Implementation Plan for PET-SUPABASE-001

## 1. Target Files

- `docs/work-items/PET-SUPABASE-001-pet-supabase-repository-adapters.md`
- `docs/work-specs/PET-SUPABASE-001-pet-supabase-repository-adapters.md`
- `apps/workers/src/pet-supabase.ts`
- `apps/workers/src/index.ts`
- `tests/workers/pet-supabase-repository.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Add a Worker-side Supabase repository adapter factory that accepts a minimal `SupabaseClientLike`. The shape mirrors the Supabase SDK query builder methods used by the adapter but keeps tests fully local and deterministic.

Expose:

- `createSupabasePetRepositories`
- `SupabaseClientLike`
- `SupabasePetRepositoryError`

The factory returns:

- `petDraftRepository`, compatible with `PetDraftRepository`
- `petPublishRepository`, compatible with `PetPublishRepository`

## 3. Testing Strategy

- Initial failing test: import the factory and assert it creates/updates rows through an injected fake client.
- Assert media asset loading maps Supabase rows into `PetMediaAssetRecord`.
- Assert publish context loads persisted pet, media and shelter verification status.
- Assert publish persistence updates only the server-derived published pet state.
- Assert thrown adapter errors are sanitized.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Supabase SDK install.
- No network calls.
- No service-role key string accepted by the adapter factory.
- No client-side exports of secrets.
- Adapter methods throw sanitized errors only.
