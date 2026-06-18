---
id: MOBILE-SHELTER-SEARCH-SCREEN-001
title: Mobile shelter search screen
status: done
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

## Contract

`apps/mobile/app/abrigos/index.tsx` is an Expo Router screen that:
- Creates `ShelterSearchClient` via `createShelterSearchClient({ workerBaseUrl: workerUrl(), shelterPath: '/shelters', fetch: globalThis.fetch })`
- Creates the boundary UI via `createMobileShelterSearchUi({ shelterSearchClient })`
- Manages state with `useState<MobileShelterSearchResultViewModel | null>` and `useEffect([], [])`
- Renders an explicit branch for each state: `null` → loading text, `empty` → empty message, `failed` → error message, `loaded` → shelter card list

## Affected Files

- `docs/work-items/MOBILE-SHELTER-SEARCH-SCREEN-001-mobile-shelter-search-screen.md` (this file)
- `apps/mobile/app/abrigos/index.tsx` — new screen
- `tests/mobile/shelter-search-screen.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #168. `apps/mobile/app/abrigos/index.tsx` auto-loads via `useEffect([])`, renders `null`/loading, `empty`, `failed`, and `loaded` (shelter card list) branches.
