---
id: MOBILE-ABRIGOS-PUBLIC-001
title: Mobile abrigos public route parity
status: done
---

# Work-Item: MOBILE-ABRIGOS-PUBLIC-001 — Mobile Abrigos Public Route Parity

## Goal

Add `/abrigos` (shelter search tab) and `/abrigos/[shelterId]` (shelter detail) as public
routes in the mobile auth guard, matching the web middleware which already allows
unauthenticated access to both paths. Without this, unauthenticated mobile users are
redirected to sign-in when navigating to the shelter tab, creating a divergence from the
web experience and blocking public browsing of shelter profiles.

Raised as P2-2 in audit `2026-06-20-sdd-audit-prs-199-203.md`.

## States

No new view model states — this is a routing change only. `isPublicRoute` is extended with
two new clauses; `computeAuthRedirect` behaviour is unchanged (it delegates to `isPublicRoute`).

## Contract

### `isPublicRoute(segments)` additions

```ts
// abrigos tab root — (app)/(tabs)/abrigos (matches web middleware /abrigos)
if (segments[0] === '(app)' && segments[1] === '(tabs)' && segments[2] === 'abrigos' && !segments[3]) return true;
// abrigos/[shelterId] public detail (matches web middleware /abrigos/:id)
if (segments[0] === 'abrigos' && segments[1] && !segments[2]) return true;
```

Deep sub-paths (e.g. `abrigos/[shelterId]/candidaturas`) remain protected — they require
authentication, consistent with the web middleware pattern.

## Affected Files

- `docs/work-items/MOBILE-ABRIGOS-PUBLIC-001-mobile-abrigos-public.md`
- `apps/mobile/src/nav.ts` — two new clauses in `isPublicRoute`
- `tests/mobile/auth-guard.test.ts` — 4 new `isPublicRoute` tests + 3 new `computeAuthRedirect` tests

## Completion Notes

- Added two clauses to `isPublicRoute` in `apps/mobile/src/nav.ts` with inline comments
  referencing web middleware parity.
- 7 new tests in `tests/mobile/auth-guard.test.ts` covering tab root public access,
  detail page public access, deep sub-path redirect, and `computeAuthRedirect` pass-through
  for both public paths.
- No new view model states; no changes to `computeAuthRedirect` logic.
- Resolves P2-2 from audit `2026-06-20-sdd-audit-prs-199-203.md`.
