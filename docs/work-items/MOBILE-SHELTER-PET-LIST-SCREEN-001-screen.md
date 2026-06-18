---
id: MOBILE-SHELTER-PET-LIST-SCREEN-001
title: Mobile shelter pet list screen
status: done
---

# Work-Item: MOBILE-SHELTER-PET-LIST-SCREEN-001 — Mobile Shelter Pet List Screen

## Goal

Create the shelter manager's animal list at `/abrigos/[shelterId]/animais` wired to
`createMobileShelterPetListUi`. Shows all pets with their status badge, species, and location label.

## States

- `null` (loading) — spinner while fetching
- `empty` — no pets in this shelter yet
- `forbidden` — user is not a shelter member; link to `/entrar`
- `failed` — network error; retry button
- `loaded` — tappable cards navigating to `/animais/[petId]`

## Affected Files

- `docs/work-items/MOBILE-SHELTER-PET-LIST-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/animais.tsx` — shelter pet list screen
- `tests/mobile/shelter-pet-list-screen.test.ts` — boundary contract tests

## Contract

- `shelterId` from `useLocalSearchParams`; passed to `ui.loadShelterPets(shelterId)`
- Cards show: name (fallback to petId), status badge (`ShelterPetStatus` mapped to PT-PT label + colour), species, locationLabel
- Status colours: published → green, adoption_pending → amber, adopted → blue, draft/archived/not_available → slate

## Completion Notes

6 boundary contract tests pass (loaded, loaded-fields, empty, forbidden, failed, getInitialState). Typecheck clean.
