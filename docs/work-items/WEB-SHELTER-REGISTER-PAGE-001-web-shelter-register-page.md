---
id: WEB-SHELTER-REGISTER-PAGE-001
title: Web shelter register page
status: done
---

# Work-Item: WEB-SHELTER-REGISTER-PAGE-001 — Web Shelter Register Page

## Goal

Create the shelter registration form page at `/abrigos/registar` wired to `createWebShelterRegistrationUi`. Auth-gated: access token retrieved inside `useEffect` via `supabase.auth.getSession()` and passed as `getAccessToken` to `createShelterRegistrationClient`. Uses `useRef` pattern — UI instance created once in `useEffect([])` and stored in ref so the submit handler can call `registerShelter` without recreating clients.

## States

- `null` (local) — loading while useEffect initialises the UI
- `idle` / `submitting` — form rendered; button disabled during submission
- `registered` — shelter created; shows shelterId link to `/abrigos/[shelterId]`
- `failed` — network/auth/validation error; if `status === 'unauthenticated'`, link to `/entrar`

## Contract

`apps/web/app/abrigos/registar/page.tsx` is a `'use client'` Next.js App Router static page that:
- Creates `createShelterRegistrationClient({ workerBaseUrl, shelterPath: '/shelters', getAccessToken, fetch })` inside `useEffect([])`
- Stores `createWebShelterRegistrationUi` instance in `useRef`
- `getAccessToken` reads from `createSupabaseBrowserClient().auth.getSession()`
- On submit: calls `uiRef.current.registerShelter(input)` with optional fields coerced to `null` when empty

## Affected Files

- `docs/work-items/WEB-SHELTER-REGISTER-PAGE-001-web-shelter-register-page.md` (this file)
- `apps/web/app/abrigos/registar/page.tsx` — new static form page
- `tests/web/shelter-register-page.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #166. `apps/web/app/abrigos/registar/page.tsx` uses `useRef` for UI instance created in `useEffect([])`. `getAccessToken` reads from `createSupabaseBrowserClient().auth.getSession()`. Empty optional strings coerced to `null` before passing to `registerShelter`.
