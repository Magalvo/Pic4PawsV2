---
id: MOBILE-SHELTER-PROFILE-SCREEN-001
title: Mobile shelter profile screen
status: in-progress
---

# Work-Item: MOBILE-SHELTER-PROFILE-SCREEN-001 — Mobile Shelter Profile Screen

## Goal

Create the shelter profile screen at `/abrigos/[shelterId]` wired to `createMobileShelterProfileUi`. Public — no auth required. Auto-loads on mount via `useEffect([shelterId])`.

## States

- `null` (local) — loading while useEffect fires
- `idle` — not yet loaded
- `loaded` — shelter details rendered
- `not_found` — shelter does not exist
- `failed` — network or server error

## Affected Files

- `docs/work-items/MOBILE-SHELTER-PROFILE-SCREEN-001-mobile-shelter-profile-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId].tsx` — new dynamic screen
- `tests/mobile/shelter-profile-screen.test.ts` — boundary contract tests
