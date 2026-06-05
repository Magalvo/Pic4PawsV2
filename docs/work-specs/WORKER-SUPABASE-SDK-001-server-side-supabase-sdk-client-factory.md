# Work-Spec: Implementation Plan for WORKER-SUPABASE-SDK-001

## 1. Target Files

- `docs/work-items/WORKER-SUPABASE-SDK-001-server-side-supabase-sdk-client-factory.md`
- `docs/work-specs/WORKER-SUPABASE-SDK-001-server-side-supabase-sdk-client-factory.md`
- `apps/workers/package.json`
- `apps/workers/src/supabase-sdk.ts`
- `apps/workers/src/index.ts`
- `tests/workers/supabase-sdk-factory.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Install `@supabase/supabase-js` in the Workers workspace. Add a small adapter module that imports `createClient` and exposes:

- `createSupabaseSdkClientFactory`
- `createSupabaseSdkWorkerDependencies`
- `SupabaseSdkClientFactoryError`

`createSupabaseSdkClientFactory` returns the existing `WorkerSupabaseClientFactory` contract and calls the SDK with:

- Supabase URL
- service-role key
- `auth.persistSession: false`
- `auth.autoRefreshToken: false`
- `auth.detectSessionInUrl: false`
- a non-secret `X-Client-Info` header

The default Worker export should pass `createSupabaseSdkWorkerDependencies()` into `handleWorkerRequest`. The `handleWorkerRequest` signature remains explicitly injectable for tests.

## 3. Testing Strategy

- Initial failing test: import the SDK factory and assert it calls an injected fake `createClient` with safe server options.
- Assert returned dependencies expose a `supabaseClientFactory` compatible with existing Worker wiring.
- Assert thrown SDK client creation errors are sanitized.
- Assert the default Worker export delegates to `handleWorkerRequest` with SDK-backed dependencies by checking routes still use explicit dependency injection in local tests.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No live Supabase project is used in tests.
- The service-role key is only passed into server-side SDK client creation.
- SDK session persistence and browser URL detection are disabled.
- Existing explicit dependency injection takes precedence for tests and local contracts.
