---
id: MOBILE-PET-STATUS-HISTORY-SCREEN-001
title: Mobile pet status history screen
status: done
---

# Work-Item: MOBILE-PET-STATUS-HISTORY-SCREEN-001 — Mobile Pet Status History Screen

## Goal

Create the pet status history screen at `/animais/[petId]/historico` wired to
`createMobilePetStatusHistoryUi`. Shows the chronological log of status transitions for a pet.

## States

- `null / idle / loading` — spinner while fetching
- `forbidden` — user does not have access; message displayed
- `failed` — network error; retry button
- `loaded (empty)` — empty-state message when no history exists
- `loaded` — flat list of `fromStatus → toStatus` pairs with PT-PT labels and date

## Affected Files

- `docs/work-items/MOBILE-PET-STATUS-HISTORY-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/animais/[petId]/historico.tsx` — pet status history screen
- `tests/mobile/pet-status-history-screen.test.ts` — boundary contract tests

## Contract

- `petId` from `useLocalSearchParams`
- `createPetStatusHistoryClient({ petFeedPath: '/pets', ... })`
- `ui.loadHistory(petId)` on mount — note: method is `loadHistory`, not `loadStatusHistory`
- `ShelterPetStatus` mapped to PT-PT labels via `STATUS_LABELS`

## Completion Notes

5 boundary contract tests pass (loading, loaded-empty, loaded-with-events, forbidden, failed). Typecheck clean.
