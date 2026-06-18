---
id: WEB-AUTH-PAGE-001
title: Web auth page — login
status: in-progress
---

# Work-Item: WEB-AUTH-PAGE-001 — Web Auth Page (Login)

## Goal

Create the login page at `/entrar` wired to `createWebAuthUi`. The user submits email and password; on success the Supabase session is stored and available to subsequent authenticated pages.

## States

- `null` (local) — initial, show empty form (no prior attempt)
- `signed_in` — success, show confirmation (Phase 3 will add redirect to protected page)
- `failed` — invalid credentials or network error, show inline error and re-enable form

## Contract

`apps/web/app/entrar/page.tsx` is a `'use client'` Next.js App Router page that:
- Keeps local `email`, `password`, `submitting` state for the controlled form
- On submit: creates a Supabase client + `WebAuthUi` inside the handler, calls `signIn(email, password)`
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` accessed only inside the handler (never at module level)
- Session is persisted via the default Supabase storage (`persistSession: true`) so that subsequent pages (adoption form, shelter edit, donation, etc.) can retrieve the access token via `supabase.auth.getSession()`
- Uses `createWebAuthUi` from `apps/web/src/auth.ts`

## Affected Files

- `docs/work-items/WEB-AUTH-PAGE-001-web-auth-page.md` (this file)
- `apps/web/src/auth.ts` — new web auth boundary
- `apps/web/src/env.ts` — add supabaseUrl() and supabaseAnonKey() helpers
- `apps/web/app/entrar/page.tsx` — new login form page
- `apps/web/package.json` — add @supabase/supabase-js
- `tests/web/auth-page.test.ts` — boundary contract tests
- `.env.example` — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

## Completion Notes

- Shipped in PR #162. `apps/web/src/auth.ts` defines `createWebAuthUi` against `SupabaseBrowserAuthClientLike`. `apps/web/app/entrar/page.tsx` creates the Supabase client inside the submit handler using default `persistSession: true` (the earlier spec said `false`, but PR #163 removed that override so sessions survive navigation to adoption/donation/shelter-edit pages).
