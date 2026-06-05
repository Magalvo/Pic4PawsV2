# Work-Spec: Implementation Plan for WORKER-SUPABASE-WIRING-001

## 1. Target Files

- `docs/work-items/WORKER-SUPABASE-WIRING-001-production-worker-supabase-dependencies.md`
- `docs/work-specs/WORKER-SUPABASE-WIRING-001-production-worker-supabase-dependencies.md`
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/index.ts`
- `tests/workers/worker-supabase-wiring.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Add a Worker dependency composition module that exposes:

- `WorkerSupabaseClientLike`
- `WorkerSupabaseClientFactory`
- `createWorkerSupabaseDependencies`
- `resolveWorkerRequestDependencies`
- `WorkerSupabaseWiringError`

The Supabase client factory accepts only:

- `supabaseUrl`
- `serviceRoleKey`

The returned Supabase-like client is passed into:

- `createSupabaseAuthAdapter`
- `createSupabasePetRepositories`

`handleWorkerRequest` will resolve Supabase dependencies only for pet draft routes when a `supabaseClientFactory` is provided. Existing explicitly injected test dependencies continue to take precedence.

## 3. Testing Strategy

- Initial failing test: import the dependency factory and assert it composes auth and pet repositories from one fake Supabase client.
- Assert `handleWorkerRequest` can create a pet draft through the composed Supabase dependencies without explicit auth/repository injection.
- Assert missing factory preserves existing `auth_adapter_not_configured` / repository-not-configured behavior.
- Assert factory failures return a sanitized `dependency_configuration_error` response without leaking service-role keys or bearer tokens.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Supabase SDK install.
- No network calls.
- No client-side exports of service-role keys.
- Explicit dependency injection still wins over auto-composed dependencies.
- HTTP errors from dependency wiring are sanitized.
