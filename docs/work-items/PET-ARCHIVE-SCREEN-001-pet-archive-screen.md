---
id: PET-ARCHIVE-SCREEN-001
title: Pet archive screen
status: done
---

# Work-Item: PET-ARCHIVE-SCREEN-001 — Pet Archive Screen

## Goal

Create the pet archive screen at `/animais/[petId]/arquivar` (mobile + web) wired to
`createMobilePetArchiveUi` / `createWebPetArchiveUi`. Auth-gated — requires Supabase
access token via `getSession()`. Single-action confirmation flow: confirm → archive → show
result. On success, navigate back.

## States

- `idle` — IDLE constant; confirmation prompt with primaryAction button
- `submitting` — set locally before async call
- `archived` — pet archived successfully; `petId` available
- `published` — republish success path (covered by ResultViewModel, not triggered here)
- `failed` — error with retry option

## Affected Files

- `docs/work-items/PET-ARCHIVE-SCREEN-001-pet-archive-screen.md` (this file)
- `apps/mobile/app/animais/[petId]/arquivar.tsx` — new mobile screen
- `apps/web/app/animais/[petId]/arquivar/page.tsx` — new web page
- `tests/mobile/pet-archive-screen.test.ts` — mobile boundary contract tests
- `tests/web/pet-archive-screen.test.ts` — web boundary contract tests

## Contract

- `createMobilePetArchiveUi({ petArchiveClient })`
- `createWebPetArchiveUi({ petArchiveClient })`
- `createPetArchiveClient({ workerBaseUrl, petFeedPath: '/pets', getAccessToken, fetch })`
- `getInitialState()` → `idle` state with `title`, `message`, `primaryAction`
- `archivePet(petId)` → `archived | failed`
- Auth: Supabase `getSession()` inside `useCallback`

## Completion Notes

- IDLE constant matches `getInitialState()` output exactly
- `published` state handled defensively (not reachable from `archivePet` alone)
- Mobile import depth from `app/animais/[petId]/arquivar.tsx`: `../../../src/`
- Web import depth from `app/animais/[petId]/arquivar/page.tsx`: `../../../../src/`
