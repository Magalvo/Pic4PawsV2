---
id: WEB-ADOPTION-DONOR-LIST-SCREEN-001
title: Web adopter adoption list page
status: done
---

# Work-Item: WEB-ADOPTION-DONOR-LIST-SCREEN-001 — Web Adopter Adoption List Page

## Goal

Create the adopter's own adoption applications list at `/adocoes` wired to
`createWebAdoptionDonorListUi`. Auth-gated — shows "Entrar na conta" link on unauthenticated.

## States

- `idle/loading` — loading message with `aria-live="polite"`
- `empty` — no applications yet; link to `/animais`
- `failed` (unauthenticated) — link to `/entrar`; retry button
- `failed` (other) — retry button only
- `loaded` — `<ul>` with links to `/adocoes/[applicationId]`, status label, date

## Affected Files

- `docs/work-items/WEB-ADOPTION-DONOR-LIST-SCREEN-001-screen.md` (this file)
- `apps/web/app/adocoes/page.tsx` — adopter adoption list page
- `tests/web/adoption-donor-list-screen.test.ts` — boundary contract tests

## Contract

- No route params — `loadDonorAdoptions()` called with no args
- Each list item links to `/adocoes/[applicationId]`
- Status labels in PT-PT for all 8 AdoptionApplicationStatus values

## Completion Notes

3 boundary contract tests pass (loaded, empty, failed). Uses `createWebAdoptionDonorListUi`
from `apps/web/src/adoption-donor-list`.
