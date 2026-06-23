# WORKER-DISPATCH-MODULAR-001 — Dispatcher and Client Modularization

status: done
**created**: 2026-06-13
**priority**: P2/P3

## Goal

Refactor the Worker dispatcher (`apps/workers/src/index.ts`) and the client package
(`packages/client/src/index.ts`) before they become maintenance liabilities. As of PR #138:

- `apps/workers/src/index.ts` is approximately 1146 lines.
- `packages/client/src/index.ts` is approximately 4730 lines.

The dispatcher relies on manual route ordering for many overlapping path matchers. This
has not caused bugs because the test suite is strong, but the architecture is increasingly
brittle as more slices are added.

## Finding being addressed

- **D7**: Worker dispatcher and client package are route-order fragile. No structural
  enforcement of ordering rules. A single misplaced matcher could silently shadow an
  existing route.

## States

N/A — structural refactoring, no state machine or UI states.

## Contract

### Worker dispatcher

Split `apps/workers/src/index.ts` into per-domain dispatch modules, for example:

- `apps/workers/src/routes/pets.ts` — all `/pets` and `/pet-drafts` routes
- `apps/workers/src/routes/shelters.ts` — all `/shelters` routes
- `apps/workers/src/routes/adoptions.ts` — all `/adoptions` routes
- `apps/workers/src/routes/donations.ts` — all `/donations` routes
- `apps/workers/src/routes/sponsorships.ts` — all `/sponsorships` routes
- `apps/workers/src/routes/notifications.ts` — all `/notifications` routes
- `apps/workers/src/routes/webhooks.ts` — all `/webhooks` routes

Each module exports a `handle(request, dependencies): Promise<Response | null>` function.
The top-level `index.ts` calls each in order and returns the first non-null response.

Ordering rules are expressed as test assertions in a dedicated route-table test, not as
inline comments.

### Client package

Split `packages/client/src/index.ts` into per-domain modules:

- `packages/client/src/pets.ts`
- `packages/client/src/shelters.ts`
- `packages/client/src/adoptions.ts`
- `packages/client/src/donations.ts`
- `packages/client/src/sponsorships.ts`
- `packages/client/src/notifications.ts`
- `packages/client/src/media.ts`

`packages/client/src/index.ts` re-exports everything from each module to preserve the
current single-package import contract (`@pic4paws/client`). No consumer changes required.

### Tests

- Route-table test: assert each path/method pair resolves to the correct handler in the
  correct order.
- No change to existing per-handler tests.

## Affected files

| File | Change |
|---|---|
| `apps/workers/src/index.ts` | refactor to per-domain dispatch modules |
| `apps/workers/src/routes/*.ts` | new per-domain dispatch modules |
| `packages/client/src/index.ts` | refactor to re-export from per-domain modules |
| `packages/client/src/*.ts` | new per-domain client modules |
| `tests/workers/route-table.test.ts` | new — route ordering assertions |

## Completion Notes

All deliverables were implemented in earlier PRs. Worker dispatcher split into `apps/workers/src/routes/{pets,shelters,adoptions,donations,sponsorships,notifications,webhooks,media,users}.ts` — each exports `handle(request, config, dependencies): Promise<Response | null>`. `apps/workers/src/index.ts` reduced to re-exports + the 10-line `ROUTE_HANDLERS` dispatch loop. Client package split into `packages/client/src/{pets,shelters,adoptions,donations,sponsorships,notifications,media,users}.ts` with `index.ts` re-exporting everything. Route-table test at `tests/workers/route-table.test.ts` asserts domain isolation (16 tests) and ordering invariants for overlapping path matchers. All 16 route-table tests pass.
