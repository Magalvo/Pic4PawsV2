---
id: MOBILE-AUTH-GUARD-001
title: Mobile auth guard routing — extract and test computeAuthRedirect
status: done
---

# Work-Item: MOBILE-AUTH-GUARD-001 — Mobile Auth Guard Routing

## Goal

Extract the auth guard routing logic from `apps/mobile/app/_layout.tsx` into a
pure, testable function `computeAuthRedirect` in `apps/mobile/src/nav.ts`.
Write unit tests that cover the full auth-guard round-trip:

- unauthenticated user on a protected route → redirect to `/entrar` with encoded `returnTo`
- unauthenticated user on a public route → no redirect
- authenticated user in the `(auth)` group → redirect to animais home
- authenticated user on any other route → no redirect
- session still loading (`undefined`) → no redirect

This resolves the deferred integration-test gap from the MOBILE-NAV-001 audit
without requiring React Native Testing Library, by testing the pure routing
decision function rather than the rendered React component.

## States

No new runtime states. The auth guard behaviour is unchanged — this work item
only refactors the implementation surface for testability.

## Contract

### `isPublicRoute(segments: string[]): boolean`

Moved from `_layout.tsx` to `apps/mobile/src/nav.ts` (exported).

```ts
// Returns true for routes that do not require authentication:
// - (auth) group (sign-in screen)
// - (app)/(tabs)/animais root (public pet feed tab)
// - animais/[petId] detail pages
```

### `computeAuthRedirect`

```ts
type AuthRedirect = { action: 'replace'; href: string };

function computeAuthRedirect(params: {
  session: Session | null | undefined; // undefined = still loading
  segments: string[];
  pathname: string;
}): AuthRedirect | null;
// Returns null when no navigation is needed (loading, public route, or already correct).
// Returns { action: 'replace', href } when a redirect is required.
```

### `_layout.tsx` update

Replace the inline guard logic with:

```ts
const redirect = computeAuthRedirect({ session, segments: segments as string[], pathname });
if (redirect) router[redirect.action](redirect.href as Href);
```

## Affected Files

- `docs/work-items/MOBILE-AUTH-GUARD-001-mobile-auth-guard-routing.md`
- `apps/mobile/src/nav.ts` — add `isPublicRoute` + `computeAuthRedirect`
- `apps/mobile/app/_layout.tsx` — use `computeAuthRedirect`, remove inline logic
- `tests/mobile/auth-guard.test.ts` — new: full auth-guard routing tests

## Completion Notes

- Extracted `isPublicRoute` and `computeAuthRedirect` from `_layout.tsx` into `nav.ts`; both exported and independently testable.
- `_layout.tsx` routing effect reduced to a single `computeAuthRedirect` call — no inline guard logic remains.
- PR #203 (initial): 23 tests covering all routing branches: loading state, unauthenticated on all public routes, unauthenticated on protected route with encoded `returnTo`, authenticated in auth group, authenticated on app routes.
- PR #205 (`MOBILE-ABRIGOS-PUBLIC-001`): extended `isPublicRoute` to include `(app)/(tabs)/abrigos` and `abrigos/[shelterId]`, matching web middleware parity; 4 additional tests added.
- Resolves the deferred P2-B from audit `2026-06-20-sdd-audit-prs-197-198.md` without React Native Testing Library, by testing the pure routing decision function.
- Validation: `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run test` 1968/1968 (244 files) ✅ · `npm run build` ✅
