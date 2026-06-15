---
id: WEB-SHELTER-UPDATE-PAGE-001
title: Web shelter update page
status: in-progress
---

# Work-Item: WEB-SHELTER-UPDATE-PAGE-001 — Web Shelter Update Page

## Goal

Create the shelter edit page at `/abrigos/[shelterId]/editar` wired to `createWebShelterUpdateUi`. Two-phase: (1) auto-loads current shelter via `createShelterProfileClient` to pre-fill the form; (2) submits changes via `createShelterUpdateClient`. Auth-gated: access token retrieved inside `useEffect` via `supabase.auth.getSession()`.

## States

- `profileLoading` (local) — loading shelter data for pre-fill
- `profileFailed` (local) — profile load failed (not_found / worker error)
- `null` (local) — update UI not yet initialised
- `idle` / `submitting` — form rendered with pre-filled values; button disabled during submission
- `updated` — changes saved; shows link to `/abrigos/[shelterId]`
- `failed` — error; if `status === 'unauthenticated'`, link to `/entrar`

## Contract

`apps/web/app/abrigos/[shelterId]/editar/page.tsx` is a `'use client'` Next.js App Router dynamic page that:
- Unwraps `params` with `use(params)` (Next.js 15 Promise params)
- In `useEffect([shelterId])`: creates both `createShelterProfileClient` and `createShelterUpdateClient`, stores update UI in `useRef`, loads profile to pre-fill form fields
- `getAccessToken` reads from `createSupabaseBrowserClient().auth.getSession()`
- On submit: calls `uiRef.current.updateShelter(shelterId, input)` with empty strings coerced to `undefined`/`null`

## Affected Files

- `docs/work-items/WEB-SHELTER-UPDATE-PAGE-001-web-shelter-update-page.md` (this file)
- `apps/web/app/abrigos/[shelterId]/editar/page.tsx` — new dynamic form page
- `tests/web/shelter-update-page.test.ts` — boundary contract tests
