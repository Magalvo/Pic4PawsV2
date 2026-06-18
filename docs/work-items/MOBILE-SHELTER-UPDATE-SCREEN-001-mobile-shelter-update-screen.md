---
id: MOBILE-SHELTER-UPDATE-SCREEN-001
title: Mobile shelter update screen
status: done
---

# Work-Item: MOBILE-SHELTER-UPDATE-SCREEN-001 — Mobile Shelter Update Screen

## Goal

Create the shelter edit screen at `/abrigos/[shelterId]/editar` wired to
`createMobileShelterUpdateUi`. Auth-gated — access token from Supabase session on submit.

## States

- `idle` — form ready; all fields optional (partial update)
- `submitting` (local flag) — request in-flight
- `updated` — success card with link back to shelter profile
- `failed` — forbidden / shelter_not_found / unauthenticated / network; retry resets to idle

## Affected Files

- `docs/work-items/MOBILE-SHELTER-UPDATE-SCREEN-001-mobile-shelter-update-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/editar.tsx` — new shelter update screen
- `tests/mobile/shelter-update-screen.test.ts` — boundary contract tests

## Contract

- `shelterId` from `useLocalSearchParams`; passed as first arg to `ui.updateShelter`
- All text fields optional — only non-empty values included in payload
- `kind` always included (always has a selection)
- Nullable fields (district, publicEmail, publicPhone, description) sent as `null` when blank
- `updated` state navigates back to `/abrigos/[shelterId]`; `unauthenticated` links to `/entrar`

## Completion Notes

8 boundary contract tests pass. Partial-update semantics: non-nullable optional fields
(name, city) omitted from payload when empty; nullable fields sent as null when blank so
users can clear them. `[shelterId]/` folder was already in place from MOBILE-DONATION-SCREEN-001.
