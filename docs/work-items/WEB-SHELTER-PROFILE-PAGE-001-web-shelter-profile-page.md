---
id: WEB-SHELTER-PROFILE-PAGE-001
title: Web shelter profile page
status: done
---

# Work-Item: WEB-SHELTER-PROFILE-PAGE-001 — Web Shelter Profile Page

## Goal

Create the shelter profile page at `/abrigos/[shelterId]` wired to `createWebShelterProfileUi`. Uses the same env/client/useEffect pattern established by WEB-PET-PROFILE-PAGE-001.

## States

- `null` (local) — loading skeleton while useEffect fires
- `loaded` — show full shelter profile with contact details
- `not_found` — shelter removed or unavailable
- `failed` — network/worker error with retry hint
- `idle` — handled defensively (getInitialState; not returned by loadProfile)

## Contract

`apps/web/app/abrigos/[shelterId]/page.tsx` is a `'use client'` Next.js App Router dynamic page that:
- Unwraps `params` with `use(params)` (Next.js 15 Promise params)
- Creates `ShelterProfileClient` and `WebShelterProfileUi` inside `useEffect([shelterId])`
- Resets viewModel to null then re-fetches if `shelterId` changes (SPA navigation between profiles)
- Renders null → loading skeleton; then loaded / not_found / failed / idle

## Affected Files

- `docs/work-items/WEB-SHELTER-PROFILE-PAGE-001-web-shelter-profile-page.md` (this file)
- `apps/web/app/abrigos/[shelterId]/page.tsx` — new dynamic page
- `tests/web/shelter-profile-page.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #161. `apps/web/app/abrigos/[shelterId]/page.tsx` resets viewModel to `null` then re-fetches on `shelterId` change. Renders `null`/loading, `loaded`, `not_found`, `failed`, and `idle` branches.
