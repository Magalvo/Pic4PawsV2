# Work-Item: WORKER-SUPABASE-WIRING-001-Production Worker Supabase Dependencies

## 1. Context & Problem

`AUTH-SUPABASE-001` and `PET-SUPABASE-001` added injectable Supabase-like adapters for authenticated actors and pet persistence. The Worker boundary still receives these dependencies manually in tests, and the runtime `fetch` handler does not yet define how production dependencies are composed from validated environment configuration.

The next foundation step is to add a server-side dependency wiring contract that creates Worker auth and persistence dependencies from a Supabase client factory. The service-role key must remain server-only and must never appear in client responses, adapter errors or serialized dependency objects.

## 2. Acceptance Criteria

- [x] A Worker Supabase dependency factory composes the auth adapter and pet repositories from one injected Supabase-like client.
- [x] The client factory receives only server-side Supabase connection input from validated config: Supabase URL and service-role key.
- [x] The Worker request boundary can use the Supabase dependency factory when no explicit auth/repository dependencies are supplied.
- [x] Missing factory keeps existing explicit `*_not_configured` responses.
- [x] Factory failures return sanitized Worker responses without leaking service-role keys, bearer tokens or provider errors.
- [x] Tests use injectable fake clients and do not connect to Supabase.
- [x] Tests fail before implementation and pass after implementation.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not install or initialize `@supabase/supabase-js`.
- Do not connect to a local or remote Supabase project.
- Do not implement payment provider dependency wiring.
- Do not implement R2 signed upload wiring in this item.
- Do not expose service-role secrets to client-executed code or HTTP responses.

## 4. Completion Notes

- Added `apps/workers/src/dependencies.ts` with `createWorkerSupabaseDependencies` and `resolveWorkerRequestDependencies`.
- Added `WorkerSupabaseClientFactory` and `WorkerSupabaseClientLike` contracts so production can provide a server-side Supabase client without installing or initializing the SDK in this item.
- The dependency factory passes only `supabaseUrl` and `serviceRoleKey` from validated config into the client factory.
- Composed dependencies reuse the existing Supabase auth adapter and pet repositories.
- `handleWorkerRequest` now resolves Supabase dependencies for pet draft routes when `supabaseClientFactory` is provided, while explicit test dependencies still take precedence.
- Factory failures return `{ status: 'dependency_configuration_error' }` with status `500` and do not leak service-role keys, bearer tokens or provider payloads.
- No Supabase SDK was installed and no live Supabase connection was made.
