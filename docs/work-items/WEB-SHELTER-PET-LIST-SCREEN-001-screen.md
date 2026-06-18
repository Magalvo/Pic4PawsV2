---
id: WEB-SHELTER-PET-LIST-SCREEN-001
title: Web shelter pet list page
status: done
---

# Work-Item: WEB-SHELTER-PET-LIST-SCREEN-001 — Web Shelter Pet List Page

## Goal

Create the shelter manager's animal list at `/abrigos/[shelterId]/animais` (Next.js App Router)
wired to `createWebShelterPetListUi`. Read-only list with status labels and links to pet profiles.

## States

- `null` (loading) — inline loading text
- `empty` — title + empty message
- `forbidden` — message + link to `/entrar`
- `failed` — title + message + retry button
- `loaded` — `<ul>` of `<li>` with `<Link>` to `/animais/[petId]`; shows name, status, species

## Affected Files

- `docs/work-items/WEB-SHELTER-PET-LIST-SCREEN-001-screen.md` (this file)
- `apps/web/app/abrigos/[shelterId]/animais/page.tsx` — shelter pet list page
- `tests/web/shelter-pet-list-page.test.ts` — boundary contract tests

## Contract

- `shelterId` from `use(params)`; passed to `ui.loadShelterPets(shelterId)`
- `workerUrl()` from `../../../../src/env`; `createSupabaseBrowserClient()` from `../../../../src/supabase-browser`
- Status labels map `ShelterPetStatus` → PT-PT strings

## Completion Notes

3 boundary contract tests pass (loaded, empty, forbidden). Typecheck clean.
