---
id: MOBILE-SHELTER-DELETE-SCREEN-001
title: Mobile shelter deletion screen
status: done
---

# Work-Item: MOBILE-SHELTER-DELETE-SCREEN-001 — Mobile Shelter Delete Screen

## Goal

Create the shelter deletion confirmation screen at `/abrigos/[shelterId]/eliminar` wired to
`createMobileShelterDeletionUi`. Requires an explicit confirmation tap before calling the API.

## States

- `idle` — warning text + "Confirmar eliminação" (red) and "Cancelar" buttons; IDLE constant used as initial state
- `submitting` — loading text while the delete request is in flight
- `deleted` — success message; "Voltar ao início" navigates to `/abrigos` via `router.replace`
- `failed` — error message; "Voltar" goes back

## Affected Files

- `docs/work-items/MOBILE-SHELTER-DELETE-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/eliminar.tsx` — shelter deletion screen
- `tests/mobile/shelter-delete-screen.test.ts` — boundary contract tests

## Contract

- `shelterId` from `useLocalSearchParams`; passed to `ui.deleteShelter(shelterId)` only after user confirms
- Module-level `IDLE` constant (`MobileShelterDeletionState`) avoids constructing Supabase client at module scope
- On success: `router.replace('/abrigos')` (not `router.back()`) so the user cannot navigate back to the deleted shelter

## Completion Notes

4 boundary contract tests pass (idle → confirm → deleted, idle → confirm → failed, getInitialState). Typecheck clean.
