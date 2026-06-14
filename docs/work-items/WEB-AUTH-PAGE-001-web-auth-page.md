---
id: WEB-AUTH-PAGE-001
title: Web auth page — login
status: in-progress
---

# Work-Item: WEB-AUTH-PAGE-001 — Web Auth Page (Login)

## Goal

Create the login page at `/entrar` wired to `createWebAuthUi`. The user submits email and password; on success the Supabase session is available in component state. Auth token never touches localStorage (persistSession: false).

## States

- `null` (local) — initial, show empty form (no prior attempt)
- `signed_in` — success, show confirmation (Phase 3 will add redirect to protected page)
- `failed` — invalid credentials or network error, show inline error and re-enable form

## Contract

`apps/web/app/entrar/page.tsx` is a `'use client'` Next.js App Router page that:
- Keeps local `email`, `password`, `submitting` state for the controlled form
- On submit: creates `SupabaseBrowserClient` + `WebAuthUi` inside the handler, calls `signIn(email, password)`
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` accessed only inside the handler (never at module level)
- `persistSession: false` — no localStorage writes; token lives in React state only
- Uses `createWebAuthUi` from `apps/web/src/auth.ts`

## Affected Files

- `docs/work-items/WEB-AUTH-PAGE-001-web-auth-page.md` (this file)
- `apps/web/src/auth.ts` — new web auth boundary
- `apps/web/src/env.ts` — add supabaseUrl() and supabaseAnonKey() helpers
- `apps/web/app/entrar/page.tsx` — new login form page
- `apps/web/package.json` — add @supabase/supabase-js
- `tests/web/auth-page.test.ts` — boundary contract tests
- `.env.example` — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
