---
id: WEB-SHELTER-SEARCH-PAGE-001
title: Web shelter search page
status: in-progress
---

# Work-Item: WEB-SHELTER-SEARCH-PAGE-001 — Web Shelter Search Page

## Goal

Create the shelter search page at `/abrigos` wired to `createWebShelterSearchUi`. Auto-loads verified shelters on mount; each shelter card links to `/abrigos/[shelterId]`.

## States

- `null` (local) — loading skeleton while useEffect fires
- `loaded` — grid of shelter cards
- `empty` — no shelters found
- `failed` — network/worker error

## Contract

`apps/web/app/abrigos/page.tsx` is a `'use client'` Next.js App Router page that:
- Creates `ShelterSearchClient` and `WebShelterSearchUi` inside `useEffect([])`
- Calls `searchShelters({})` on mount
- Note: `WebShelterSearchResultViewModel` does not include an idle state — `null` covers loading

## Affected Files

- `docs/work-items/WEB-SHELTER-SEARCH-PAGE-001-web-shelter-search-page.md` (this file)
- `apps/web/app/abrigos/page.tsx` — new static page
- `tests/web/shelter-search-page.test.ts` — boundary contract tests
