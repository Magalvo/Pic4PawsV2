---
id: WEB-PET-PROFILE-PAGE-001
title: Web pet profile page
status: in-progress
---

# Work-Item: WEB-PET-PROFILE-PAGE-001 — Web Pet Profile Page

## Goal

Create the pet profile page at `/animais/[petId]` wired to `createWebPetProfileUi`. Uses the same env/client/useEffect pattern established by WEB-PET-FEED-PAGE-001.

## States

- `null` (local) — loading skeleton while useEffect fires
- `loaded` — show full pet profile
- `not_found` — pet removed or unavailable
- `failed` — network/worker error with retry hint

## Contract

`apps/web/app/animais/[petId]/page.tsx` is a `'use client'` Next.js App Router dynamic page that:
- Unwraps `params` with `use(params)` (Next.js 15 Promise params)
- Creates `PetProfileClient` and `WebPetProfileUi` inside `useEffect([petId])`
- Re-fetches automatically if `petId` changes (SPA navigation between profiles)
- Renders null → loading skeleton; then loaded / not_found / failed

## Affected Files

- `docs/work-items/WEB-PET-PROFILE-PAGE-001-web-pet-profile-page.md` (this file)
- `apps/web/app/animais/[petId]/page.tsx` — new dynamic page
- `tests/web/pet-profile-page.test.ts` — verifies the page module exports a default component
