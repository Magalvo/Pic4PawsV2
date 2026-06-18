---
id: MOBILE-PET-PROFILE-SCREEN-001
title: Mobile pet profile screen
status: done
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

## Contract

`apps/mobile/app/animais/[petId].tsx` is an Expo Router dynamic screen that:
- Reads `petId` from `useLocalSearchParams`
- Creates `PetProfileClient` via `createPetProfileClient({ workerBaseUrl: workerUrl(), petFeedPath: '/pets', fetch: globalThis.fetch })`
- Creates the boundary UI via `createMobilePetProfileUi({ profileClient })`
- Manages state with `useState<MobilePetProfileResultViewModel | null>` and `useEffect([petId])`
- Renders an explicit branch for each state: `null`/`idle` → loading text, `not_found` → not-found message, `failed` → error message, `loaded` → pet detail view

## Affected Files

- `docs/work-items/MOBILE-PET-PROFILE-SCREEN-001-mobile-pet-profile-screen.md` (this file)
- `apps/mobile/app/animais/[petId].tsx` — new dynamic screen
- `tests/mobile/pet-profile-screen.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #168. `apps/mobile/app/animais/[petId].tsx` auto-loads in `useEffect([petId])` and renders `null`/loading, `loaded`, `not_found`, and `failed` branches.
