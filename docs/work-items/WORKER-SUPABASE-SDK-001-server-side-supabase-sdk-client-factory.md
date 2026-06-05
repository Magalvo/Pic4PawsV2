# Work-Item: WORKER-SUPABASE-SDK-001-Server-Side Supabase SDK Client Factory

## 1. Context & Problem

`WORKER-SUPABASE-WIRING-001` added an injectable Worker dependency boundary that can compose auth and pet repositories from a `WorkerSupabaseClientFactory`. That contract is intentionally SDK-free and testable, but production still needs a real server-side Supabase SDK client factory behind it.

This item adds the actual `@supabase/supabase-js` dependency only to the Workers app and exposes a safe factory for Cloudflare Worker runtime use. The service-role key must stay server-side, SDK session persistence must be disabled, and tests must remain local through an injected `createClient` function.

## 2. Acceptance Criteria

- [x] `@pic4paws/workers` depends on `@supabase/supabase-js`.
- [x] A Supabase SDK client factory returns a `WorkerSupabaseClientFactory`.
- [x] The factory calls `createClient` with Supabase URL, service-role key and server-safe auth options.
- [x] SDK auth options disable session persistence, auto-refresh and URL session detection.
- [x] Default Worker `fetch` uses the SDK factory for pet draft routes without changing explicit test dependency injection.
- [x] Factory failures throw sanitized errors without exposing service-role keys, bearer tokens or provider payloads.
- [x] Tests inject a fake `createClient` function and do not connect to Supabase.
- [x] Tests fail before implementation and pass after implementation.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not make live Supabase requests in tests.
- Do not add schema migrations.
- Do not change pet/auth repository query behavior.
- Do not wire payment providers or R2 signing.
- Do not expose service-role secrets to client-executed code or HTTP responses.

## 4. Completion Notes

- Added `@supabase/supabase-js` to `@pic4paws/workers` only.
- Added `apps/workers/src/supabase-sdk.ts` with an injectable SDK client factory and default Worker dependency composition.
- Kept local tests offline by injecting a fake `createClient` function.
- Verified sanitized factory errors do not leak service-role keys, bearer tokens or provider payloads.
- Validation passed on 2026-06-05: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
