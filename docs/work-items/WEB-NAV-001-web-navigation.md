---
id: WEB-NAV-001
title: Web navigation — auth middleware + return URL
status: in-progress
---

# Work-Item: WEB-NAV-001 — Web Navigation

## Goal

Wire Next.js middleware to guard all protected routes. Unauthenticated requests to
protected routes redirect to `/entrar?next=<encoded-path>`. After sign-in, the user
is returned to the page they originally requested. Authenticated users who land on
`/entrar` are sent directly to their destination.

## Public routes (no auth required)

- `/entrar` — login page itself
- `/animais` — public pet listing
- `/animais/[petId]` — public pet detail (any path matching `/animais/[^/]+$`)
- `/abrigos` — public shelter listing
- `/abrigos/[shelterId]` — public shelter detail (any path matching `/abrigos/[^/]+$`)

Everything else requires an authenticated Supabase session.

## States

The middleware itself is stateless — it reads the session cookie on every request and
issues a redirect or passes through. No local component state involved.

`apps/web/app/entrar/page.tsx` gains one new state transition:

- On `signed_in`: read `next` from `searchParams`, validate it is a relative path
  (starts with `/`, not `//` or `http`), then `router.replace(next)`. Fall back to
  `/animais` if `next` is absent or invalid.

## Contract

### `apps/web/middleware.ts`

```ts
// Runs on every request matched by the `config.matcher`.
// Uses @supabase/ssr createServerClient to read the session from cookies.
// Decision table:
//   route is public                          → pass through (NextResponse.next())
//   route is protected + session present     → pass through
//   route is protected + no session          → redirect to /entrar?next=<encodedPath>
//   route is /entrar + session present       → redirect to next param (validated) or /animais
//   route is /entrar + no session            → pass through
// Cookie refresh: forward Set-Cookie from Supabase client onto the response.
```

- Uses `createServerClient` from `@supabase/ssr`, not `@supabase/supabase-js`.
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
  `process.env` (already present as Next.js public env vars).
- `next` query param is `encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)`.
- `next` validation: must start with `/` and not match `//` or `/http`.
- Matcher excludes `/_next/`, `/favicon.ico`, and static assets.

### `apps/web/app/entrar/page.tsx`

- Reads `searchParams.next` (string | undefined) via the `searchParams` prop
  (Next.js App Router passes this as a prop to page components).
- After a successful `signed_in` result from `ui.signIn(...)`, calls
  `router.replace(validatedNext ?? '/animais')`.
- Validation mirrors middleware: relative path only.

## Affected Files

- `docs/work-items/WEB-NAV-001-web-navigation.md` (this file)
- `apps/web/package.json` — add `@supabase/ssr ^0.6.0`
- `apps/web/middleware.ts` — new file, auth guard
- `apps/web/app/entrar/page.tsx` — add `next` param handling + post-login redirect
- `tests/web/auth-page.test.ts` — extend with redirect-after-login assertion
