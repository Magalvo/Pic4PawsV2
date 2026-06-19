---
id: MOBILE-AUTH-SCREEN-001
title: Mobile auth screen
status: done
---

# Work-Item: MOBILE-AUTH-SCREEN-001 — Mobile Auth Screen

## Goal

Create the auth screen at `/entrar` wired to `createMobileAuthUi`. Public — no auth required.
Submit handler fires on button press (no HTML form). `persistSession: false` so no AsyncStorage
dependency.

## States

- `null` (local) — not yet submitted
- `signed_in` — sign-in succeeded, access token available
- `failed` — wrong credentials or network error

## Contract

`apps/mobile/app/entrar.tsx` is a screen that:
- Creates a Supabase client inside the submit handler with `{ auth: { persistSession: false } }` — no AsyncStorage dependency
- Uses `createMobileAuthUi({ authClient })` from `apps/mobile/src/auth.ts`
- Calls `ui.signIn(email, password)` on button press; result drives the rendered state
- `getInitialState()` returns `{ state: 'idle', title, message, primaryAction }` for the initial render without a real auth client
- On success: `{ state: 'signed_in', ... }` — navigates to the previous route
- On failure: `{ state: 'failed', title, message, reasons }` — reasons sanitized (no bearer/service-role markers)

## Affected Files

- `docs/work-items/MOBILE-AUTH-SCREEN-001-mobile-auth-screen.md` (this file)
- `apps/mobile/package.json` — add `@supabase/supabase-js ^2.107.0`
- `apps/mobile/src/env.ts` — add `supabaseUrl()` and `supabaseAnonKey()` helpers
- `apps/mobile/src/auth.ts` — new mobile auth boundary
- `apps/mobile/app/entrar.tsx` — new screen
- `tests/mobile/auth-screen.test.ts` — boundary contract tests
