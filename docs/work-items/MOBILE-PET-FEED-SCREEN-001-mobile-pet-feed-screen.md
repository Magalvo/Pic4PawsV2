---
id: MOBILE-PET-FEED-SCREEN-001
title: Mobile pet feed screen
status: in-progress
---

# Work-Item: MOBILE-PET-FEED-SCREEN-001 — Mobile Pet Feed Screen

## Goal

Create the pet feed screen at `/animais` wired to `createMobilePetFeedUi`. Public — no auth required. Auto-loads on mount via `useEffect([])`.

## States

- `null` (local) — loading while useEffect fires
- `idle` — UI initialised, load not yet complete
- `loaded` — list of pets rendered
- `empty` — no pets available
- `failed` — network or server error

## Affected Files

- `docs/work-items/MOBILE-PET-FEED-SCREEN-001-mobile-pet-feed-screen.md` (this file)
- `apps/mobile/src/env.ts` — new `workerUrl()` helper
- `apps/mobile/app/animais/index.tsx` — new screen
- `tests/mobile/pet-feed-screen.test.ts` — boundary contract tests
