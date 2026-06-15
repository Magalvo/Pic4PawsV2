---
id: MOBILE-AUTH-SCREEN-001
title: Mobile auth screen
status: in-progress
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

## Affected Files

- `docs/work-items/MOBILE-AUTH-SCREEN-001-mobile-auth-screen.md` (this file)
- `apps/mobile/package.json` — add `@supabase/supabase-js ^2.107.0`
- `apps/mobile/src/env.ts` — add `supabaseUrl()` and `supabaseAnonKey()` helpers
- `apps/mobile/src/auth.ts` — new mobile auth boundary
- `apps/mobile/app/entrar.tsx` — new screen
- `tests/mobile/auth-screen.test.ts` — boundary contract tests
