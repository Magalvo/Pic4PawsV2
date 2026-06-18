---
id: MOBILE-PET-FEED-SCREEN-001
title: Mobile pet feed screen
status: done
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

## Contract

`apps/mobile/app/animais/index.tsx` is an Expo Router screen that:
- Creates `PetFeedClient` via `createPetFeedClient({ workerBaseUrl: workerUrl(), petFeedPath: '/pets', fetch: globalThis.fetch })`
- Creates the boundary UI via `createMobilePetFeedUi({ feedClient })`
- Manages state with `useState<MobilePetFeedResultViewModel | null>` and `useEffect([], [])`
- Renders an explicit branch for each state: `null`/`idle` → loading text, `empty` → empty message, `failed` → error message, `loaded` → pet card list

## Affected Files

- `docs/work-items/MOBILE-PET-FEED-SCREEN-001-mobile-pet-feed-screen.md` (this file)
- `apps/mobile/src/env.ts` — new `workerUrl()` helper
- `apps/mobile/app/animais/index.tsx` — new screen
- `tests/mobile/pet-feed-screen.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #168. `apps/mobile/app/animais/index.tsx` auto-loads via `useEffect([])`, renders `null`/idle/loading, `empty`, `failed`, and `loaded` (pet card list) branches. `apps/mobile/src/env.ts` provides `workerUrl()` helper.
