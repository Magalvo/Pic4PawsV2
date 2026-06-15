---
id: MOBILE-PET-PROFILE-SCREEN-001
title: Mobile pet profile screen
status: in-progress
---

# Work-Item: MOBILE-PET-PROFILE-SCREEN-001 — Mobile Pet Profile Screen

## Goal

Create the pet profile screen at `/animais/[petId]` wired to `createMobilePetProfileUi`. Public — no auth required. Auto-loads on mount via `useEffect([petId])`.

## States

- `null` (local) — loading while useEffect fires
- `idle` — not yet loaded
- `loaded` — pet details rendered
- `not_found` — pet does not exist
- `failed` — network or server error

## Affected Files

- `docs/work-items/MOBILE-PET-PROFILE-SCREEN-001-mobile-pet-profile-screen.md` (this file)
- `apps/mobile/app/animais/[petId].tsx` — new dynamic screen
- `tests/mobile/pet-profile-screen.test.ts` — boundary contract tests
