---
id: MOBILE-AUTH-GUARD-001
title: Mobile auth guard routing — extract and test computeAuthRedirect
status: in-progress
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
