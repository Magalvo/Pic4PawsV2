# Work-Spec: Implementation Plan for AUTH-SUPABASE-001

## 1. Target Files

- `docs/work-items/AUTH-SUPABASE-001-supabase-auth-adapter.md`
- `docs/work-specs/AUTH-SUPABASE-001-supabase-auth-adapter.md`
- `apps/workers/src/auth-supabase.ts`
- `apps/workers/src/index.ts`
- `tests/workers/auth-supabase-adapter.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Add a Worker-side Supabase auth adapter factory that accepts a minimal `SupabaseAuthClientLike`. The shape mirrors only the Supabase SDK calls needed at the boundary:

- `auth.getUser(bearerToken)` to validate the bearer token and obtain the Supabase auth user id.
- `from('users')...maybeSingle()` to load the Pic4Paws application user.
- `from('shelter_memberships')...` to load active shelter memberships.

Expose:

- `createSupabaseAuthAdapter`
- `SupabaseAuthClientLike`
- `SupabaseAuthAdapterError`

The returned function is compatible with the existing `WorkerPetDraftAuthenticator`.

## 3. Testing Strategy

- Initial failing test: import the factory and assert it resolves an active actor through an injected fake client.
- Assert deleted memberships are excluded and rows map from snake_case to domain auth contracts.
- Assert missing Supabase/app users and inactive users resolve to `null`.
- Assert thrown adapter errors are sanitized and do not leak service-role keys or bearer tokens.

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
