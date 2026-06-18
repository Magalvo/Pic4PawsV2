---
id: WEB-SPONSORSHIP-LIST-SCREEN-001
title: Web shelter sponsorship list page
status: done
---

# Work-Item: WEB-SPONSORSHIP-LIST-SCREEN-001 — Web Shelter Sponsorship List Page

## Goal

Create the shelter manager's received sponsorships list at `/abrigos/[shelterId]/patrocinios`
wired to `createWebSponsorshipListUi`. Read-only view of all sponsorships for a shelter.

## States

- `idle/loading` — loading message with `aria-live="polite"`
- `empty` — no sponsorships for this shelter
- `forbidden` — user is not a shelter member; link to `/entrar`
- `failed` — network error; retry button
- `loaded` — `<ul>` with amount, interval, status label, petId if present, date

## Affected Files

- `docs/work-items/WEB-SPONSORSHIP-LIST-SCREEN-001-screen.md` (this file)
- `apps/web/app/abrigos/[shelterId]/patrocinios/page.tsx` — shelter sponsorship list page
- `tests/web/sponsorship-list-page.test.ts` — boundary contract tests

## Contract

- `shelterId` from `use(params)`; passed to `ui.loadSponsorships(shelterId)`
- Read-only list — no links to manage screen (shelter manager view only)

## Completion Notes

3 boundary contract tests pass (loaded, empty, forbidden).
