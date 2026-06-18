---
id: MOBILE-SHELTER-PROFILE-SCREEN-001
title: Mobile shelter profile screen
status: done
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

## Contract

`apps/mobile/app/abrigos/[shelterId].tsx` is an Expo Router dynamic screen that:
- Reads `shelterId` from `useLocalSearchParams`
- Creates `ShelterProfileClient` via `createShelterProfileClient({ workerBaseUrl: workerUrl(), shelterPath: '/shelters', fetch: globalThis.fetch })`
- Creates the boundary UI via `createMobileShelterProfileUi({ shelterProfileClient })`
- Manages state with `useState<MobileShelterProfileResultViewModel | null>` and `useEffect([shelterId])`
- Renders an explicit branch for each state: `null`/`idle` → loading text, `not_found` → not-found message, `failed` → error message, `loaded` → shelter detail view

## Affected Files

- `docs/work-items/MOBILE-SHELTER-PROFILE-SCREEN-001-mobile-shelter-profile-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId].tsx` — new dynamic screen
- `tests/mobile/shelter-profile-screen.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #168. `apps/mobile/app/abrigos/[shelterId].tsx` auto-loads in `useEffect([shelterId])` and renders `null`/loading, `loaded`, `not_found`, and `failed` branches.
