---
id: MOBILE-SHELTER-SEARCH-SCREEN-001
title: Mobile shelter search screen
status: in-progress
---

# Work-Item: MOBILE-SHELTER-SEARCH-SCREEN-001 — Mobile Shelter Search Screen

## Goal

Create the shelter search screen at `/abrigos` wired to `createMobileShelterSearchUi`. Public — no auth required. Auto-loads on mount via `useEffect([])`.

## States

- `null` (local) — loading while useEffect fires
- `idle` — UI initialised, search not yet complete
- `loaded` — list of shelters rendered
- `empty` — no shelters found
- `failed` — network or server error

## Affected Files

- `docs/work-items/MOBILE-SHELTER-SEARCH-SCREEN-001-mobile-shelter-search-screen.md` (this file)
- `apps/mobile/app/abrigos/index.tsx` — new screen
- `tests/mobile/shelter-search-screen.test.ts` — boundary contract tests
