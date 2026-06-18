---
id: WEB-PET-STATUS-HISTORY-SCREEN-001
title: Web pet status history page
status: done
---

# Work-Item: WEB-PET-STATUS-HISTORY-SCREEN-001 — Web Pet Status History Page

## Goal

Create the pet status history page at `/animais/[petId]/historico` wired to
`createWebPetStatusHistoryUi`. Shows the chronological log of status transitions for a pet.

## States

- `null / idle / loading` — loading message while fetching
- `forbidden` — user does not have access; message displayed
- `failed` — error message with retry button
- `loaded (empty)` — empty-state paragraph when no history exists
- `loaded` — `<ul>` of `fromStatus → toStatus` items with PT-PT labels and date

## Affected Files

- `docs/work-items/WEB-PET-STATUS-HISTORY-SCREEN-001-screen.md` (this file)
- `apps/web/app/animais/[petId]/historico/page.tsx` — pet status history page
- `tests/web/pet-status-history-page.test.ts` — boundary contract tests

## Contract

- Import depth from `apps/web/`: 4 levels → `../../../../src/`
- `petId` from `use(params)`
- `createPetStatusHistoryClient({ petFeedPath: '/pets', ... })`
- `ui.loadHistory(petId)` on mount — method is `loadHistory`, not `loadStatusHistory`
- `ShelterPetStatus` mapped to PT-PT labels via `STATUS_LABELS`

## Completion Notes

3 boundary contract tests pass (loading, loaded-with-events, forbidden). Typecheck clean.
