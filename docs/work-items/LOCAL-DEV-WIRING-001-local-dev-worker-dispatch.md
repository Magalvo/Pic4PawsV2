---
id: LOCAL-DEV-WIRING-001
title: Wire local dev stack and fix Worker request dispatch
status: done
---

# Work-Item: LOCAL-DEV-WIRING-001 — Local Dev Worker Dispatch

## Context & Problem

The Worker's `_dispatchWorkerRequest` function never called `resolveWorkerRequestDependencies`,
so all Supabase repositories were `undefined` at runtime and every route returned 501.
The Worker also had no CORS headers (blocking browser requests from the Next.js dev origin)
and no `wrangler.toml` / `.dev.vars.example` to run locally with `wrangler dev`.

## Goal

Make the full local dev stack runnable end-to-end: Worker starts with `wrangler dev`,
browser requests from the Next.js origin succeed, and all Supabase repositories are
correctly resolved on every request.

## States

No new ViewModel states. Infrastructure-only change.

## Contract

- `apps/workers/wrangler.toml` — new; configures the local Worker entrypoint and bindings.
- `apps/workers/.dev.vars.example` — new; documents all required secrets for local dev.
- `apps/workers/src/index.ts` — `_dispatchWorkerRequest` calls `resolveWorkerRequestDependencies`
  before routing; `WorkerSupabaseWiringError` mapped to `dependency_configuration_error`.
- `apps/workers/src/http.ts` — CORS helpers: `OPTIONS` preflight handler +
  `Access-Control-Allow-Origin` on all responses.
- `apps/workers/src/routes/shared.ts` — `assertSupabaseResult` surfaces errors via `console.error`.
- `apps/web/middleware.ts` — `/` added to public routes so homepage is accessible unauthenticated.
- `apps/web/app/layout.tsx` — `suppressHydrationWarning` on `<body>`.
- `.gitignore` — `.dev.vars` excluded; `.dev.vars.example` tracked.

## Acceptance Criteria

- [x] `apps/workers/wrangler.toml` exists and configures local Worker.
- [x] `apps/workers/.dev.vars.example` documents all required secrets.
- [x] `_dispatchWorkerRequest` calls `resolveWorkerRequestDependencies` before routing.
- [x] CORS OPTIONS preflight handled; `Access-Control-Allow-Origin` on all responses.
- [x] `WorkerSupabaseWiringError` returns `dependency_configuration_error`.
- [x] `assertSupabaseResult` logs errors via `console.error`.
- [x] `/` is a public route in `apps/web/middleware.ts`.
- [x] `.dev.vars` gitignored.
- [x] All existing tests pass.

## Non-Goals

- Do not change production wrangler config or CI secrets.
- Do not add new Worker routes.

## Affected Files

- `docs/work-items/LOCAL-DEV-WIRING-001-local-dev-worker-dispatch.md` (this file)
- `apps/workers/src/index.ts`
- `apps/workers/src/http.ts`
- `apps/workers/src/routes/shared.ts`
- `apps/workers/src/pet-supabase.ts`
- `apps/workers/wrangler.toml`
- `apps/workers/.dev.vars.example`
- `apps/web/middleware.ts`
- `apps/web/app/layout.tsx`
- `.gitignore`
- `docs/easypay-integration-research.md`

## Completion Notes

Implemented in PR #300 (`agent/LOCAL-DEV-WIRING-001`), merged 2026-06-29.
Service-role migration 0011 (PR #301, `SERVICE-ROLE-GRANTS-001`) discovered and fixed
during the same local dev session.
