---
id: PET-PUBLISH-SCREEN-001
title: Pet publish screen
status: done
---

# Work-Item: PET-PUBLISH-SCREEN-001 — Pet Publish Screen

## Goal

Create the pet publish screen at `/animais/[petId]/publicar` (mobile + web) wired to
`createMobilePetPublishUi` / `createWebPetPublishUi`. Auth-gated — requires Supabase
access token via `getSession()`. Single-action confirmation flow: confirm → publish draft
→ show result. On success, navigate back.

## States

- `ready` — initial state from `getInitialState({ petId, petName })`; confirmation prompt
- `publishing` — set locally before async call (not exported by boundary)
- `published` — pet draft published; includes `publishedAt`
- `failed` — error with retry option

## Affected Files

- `docs/work-items/PET-PUBLISH-SCREEN-001-pet-publish-screen.md` (this file)
- `apps/mobile/app/animais/[petId]/publicar.tsx` — new mobile screen
- `apps/web/app/animais/[petId]/publicar/page.tsx` — new web page
- `tests/mobile/pet-publish-screen.test.ts` — mobile boundary contract tests
- `tests/web/pet-publish-screen.test.ts` — web boundary contract tests

## Contract

- `createMobilePetPublishUi({ publishClient })`
- `createWebPetPublishUi({ publishClient })`
- `createPetPublishClient({ workerBaseUrl, petDraftsPath: '/pets/drafts', getAccessToken, fetch })`
- `getInitialState({ petId, petName })` → `ready` state with `title`, `message`, `primaryAction`, `petId`, `petName`
- `publishPetDraft({ pet: { petId, petName } })` → `published | failed`
- Auth: Supabase `getSession()` inside `useCallback`
- `petName` passed as URL search param alongside dynamic `[petId]` segment

## Completion Notes

- `petName` defaults to empty string if absent from search params
- "publishing" state defined inline (not exported by boundary)
- `PetPublishClientSuccess.status` is `'pet_published'` (not `'ok'`)
- Mobile import depth from `app/animais/[petId]/publicar.tsx`: `../../../src/`
- Web import depth from `app/animais/[petId]/publicar/page.tsx`: `../../../../src/`
