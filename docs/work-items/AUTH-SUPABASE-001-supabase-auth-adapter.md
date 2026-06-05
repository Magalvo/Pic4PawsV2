# Work-Item: AUTH-SUPABASE-001-Supabase Auth Adapter

## 1. Context & Problem

`AUTH-001` defined pure role-aware authorization contracts and the pet Worker routes already accept an injectable authenticator. The Worker boundary still needs a Supabase adapter contract that verifies bearer tokens server-side, resolves the active application user and loads active shelter memberships without exposing service-role secrets to clients.

The adapter must remain testable without a live Supabase project or the Supabase SDK. It should accept a minimal Supabase-like client, map snake_case database rows into domain auth contracts and sanitize all failures.

## 2. Acceptance Criteria

- [x] A Supabase auth adapter verifies bearer tokens through an injected auth client.
- [x] The adapter resolves active application users from `users.auth_user_id`.
- [x] The adapter loads non-deleted shelter memberships for the resolved application user.
- [x] Missing Supabase users, missing application users and inactive application users resolve to `null`.
- [x] Adapter responses and errors do not expose service-role keys, bearer tokens or provider error payloads.
- [x] Tests use an injectable Supabase-like client and do not connect to Supabase.
- [x] Tests fail before implementation and pass after the adapter contract is implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not install or initialize `@supabase/supabase-js`.
- Do not connect to a local or remote Supabase project.
- Do not implement full Worker dependency wiring with real environment secrets.
- Do not implement UI.
- Do not put service-role secrets in client-executed code.

## 4. Completion Notes

- Added `createSupabaseAuthAdapter` with injectable `SupabaseAuthClientLike`.
- The adapter verifies bearer tokens through `auth.getUser`, loads active application users from `users` and loads non-deleted shelter memberships from `shelter_memberships`.
- The adapter maps snake_case Supabase rows to existing domain authorization contracts and returns a `WorkerPetDraftAuthenticator`.
- Missing Supabase users, missing application users and inactive application users resolve to `null`.
- Adapter failures throw sanitized `SupabaseAuthAdapterError` messages without exposing service-role keys, bearer tokens or provider payloads.
- No Supabase SDK was installed, no client was initialized and no network/database call was executed.
