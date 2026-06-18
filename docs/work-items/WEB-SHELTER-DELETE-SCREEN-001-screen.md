---
id: WEB-SHELTER-DELETE-SCREEN-001
title: Web shelter deletion page
status: done
---

# Work-Item: WEB-SHELTER-DELETE-SCREEN-001 — Web Shelter Delete Page

## Goal

Create the shelter deletion confirmation page at `/abrigos/[shelterId]/eliminar` (Next.js App Router)
wired to `createWebShelterDeletionUi`. Requires explicit confirmation before calling the API.

## States

- `idle` (IDLE constant) — warning + confirm button (red) + cancel button
- `submitting` — loading text while request is in flight
- `deleted` — success message; "Voltar ao início" navigates to `/abrigos` via `router.replace`
- `failed` — error message; "Voltar" goes back

## Affected Files

- `docs/work-items/WEB-SHELTER-DELETE-SCREEN-001-screen.md` (this file)
- `apps/web/app/abrigos/[shelterId]/eliminar/page.tsx` — shelter deletion page
- `tests/web/shelter-delete-page.test.ts` — boundary contract tests

## Contract

- `shelterId` from `use(params)`; `ui.deleteShelter(shelterId)` called only after confirm tap
- Module-level `IDLE: WebShelterDeletionState` constant prevents Supabase client construction at module scope
- On success: `router.replace('/abrigos')` so user cannot navigate back to the deleted shelter

## Completion Notes

3 boundary contract tests pass (deleted, failed, getInitialState). Typecheck clean.
