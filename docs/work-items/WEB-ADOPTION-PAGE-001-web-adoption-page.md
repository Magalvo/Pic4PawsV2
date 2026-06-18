---
id: WEB-ADOPTION-PAGE-001
title: Web adoption application page
status: done
---

# Work-Item: WEB-ADOPTION-PAGE-001 — Web Adoption Application Page

## Goal

Create the adoption application form page at `/animais/[petId]/adotar` wired to `createWebAdoptionUi`. Auth-gated: the Supabase session's access token is retrieved inside the submit handler via `auth.getSession()` and passed as `getAccessToken` to `createAdoptionApplicationClient`.

## States

- `null` (local) — loading while useEffect initialises the UI
- `idle` — show adoption application form (from `getInitialState()`)
- `submitted` — application sent successfully
- `pet_not_found` — animal no longer available
- `failed` — network/auth error; if `status === 'unauthenticated'`, link to `/entrar`

## Contract

`apps/web/app/animais/[petId]/adotar/page.tsx` is a `'use client'` Next.js App Router dynamic page that:
- Unwraps `params` with `use(params)` (Next.js 15 Promise params)
- Stores the UI instance in a `useRef`; `useEffect([petId])` creates `createAdoptionApplicationClient` + `createWebAdoptionUi`, stores it in the ref, sets `viewModel` to `getInitialState()`
- `getAccessToken` calls `supabase.auth.getSession()` (session persisted via default Supabase storage)
- On form submit: calls `uiRef.current.submitApplication(input)` with all required consent fields hardcoded at submit time
- Login page must use default `persistSession` (no override) for sessions to survive navigation

## Affected Files

- `docs/work-items/WEB-ADOPTION-PAGE-001-web-adoption-page.md` (this file)
- `apps/web/src/supabase-browser.ts` — new shared browser client factory (used by all Phase 3+ pages)
- `apps/web/app/entrar/page.tsx` — remove `persistSession: false` so sessions persist across navigation (applied in this PR)
- `apps/web/app/animais/[petId]/adotar/page.tsx` — new dynamic form page
- `tests/web/adoption-page.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #163. `apps/web/app/animais/[petId]/adotar/page.tsx` stores UI in `useRef`, calls `getInitialState()` on mount, submits via `submitApplication`. Also introduced `apps/web/src/supabase-browser.ts` shared browser client factory and removed the original `persistSession: false` from `entrar/page.tsx` (session must persist for cross-page auth).
