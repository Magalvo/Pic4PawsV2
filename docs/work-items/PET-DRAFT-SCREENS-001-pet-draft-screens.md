---
id: PET-DRAFT-SCREENS-001
title: Pet draft screens
status: done
---

# Work-Item: PET-DRAFT-SCREENS-001 — Pet Draft Screens

## Goal

Create the pet draft create and edit screens (mobile + web) wired to
`createMobilePetDraftUi` / `createWebPetDraftUi`. Auth-gated via Supabase `getSession()`.
Two distinct flows: create (new draft, `shelterId` from search params) and edit (load
existing draft on mount, then update). Both share a form with name, species, location,
description, and medical toggles.

## States

**Create flow:**
- `ready` — empty form, primaryAction: 'Guardar rascunho'
- `saving` — set locally before async call (not exported)
- `saved` — draft created, `operation: 'create'`
- `failed` — error with retry

**Edit flow:**
- `loading` — null load state on mount while `loadDraft` runs
- `loaded` — form pre-populated from `draft`
- `not_found` / `forbidden` — load error states
- `failed` (load) — load error with reasons
- `saving` / `saved` / `failed` (save) — same as create after form submit

## Affected Files

- `docs/work-items/PET-DRAFT-SCREENS-001-pet-draft-screens.md` (this file)
- `apps/mobile/app/animais/rascunhos/novo.tsx` — mobile create screen
- `apps/mobile/app/animais/rascunhos/[petId]/editar.tsx` — mobile edit screen
- `apps/web/app/animais/rascunhos/novo/page.tsx` — web create page
- `apps/web/app/animais/rascunhos/[petId]/editar/page.tsx` — web edit page
- `tests/mobile/pet-draft-screen.test.ts` — mobile boundary contract tests
- `tests/web/pet-draft-screen.test.ts` — web boundary contract tests

## Contract

- `createMobilePetDraftUi({ draftClient })` / `createWebPetDraftUi({ draftClient })`
- `createPetDraftClient({ workerBaseUrl, petDraftsPath: '/pets/drafts', getAccessToken, fetch })`
- `draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft' | 'loadPetDraft'>`
- `getInitialState({ petName? })` → `ready` state
- `createDraft({ draft })` → `saved | failed` (operation: 'create')
- `updateDraft({ draft })` → `saved | failed` (operation: 'update')
- `loadDraft(petId)` → `loaded | not_found | forbidden | failed`
- `PetDraftClientSuccess.status`: `'pet_draft_created' | 'pet_draft_updated'`
- `LoadPetDraftClientSuccess.status`: `'pet_draft_loaded'`

## Completion Notes

- `PetLifecycleStatus = 'draft' | 'published' | 'archived'` (from `@pic4paws/domain`)
- `PetLifecycleSpecies = 'dog' | 'cat' | 'other'` (from `@pic4paws/domain`)
- `PublicPetMedicalStatus` fields all optional booleans
- `shelterId` for create comes from URL search params
- `petId: ''` passed in create draft input (ignored by worker POST route)
- Mobile import depths: `../../../src/` (novo), `../../../../src/` (editar)
- Web import depths: `../../../../src/` (novo), `../../../../../src/` (editar)
