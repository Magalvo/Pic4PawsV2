---
id: MOBILE-ADOPTION-DONOR-LIST-SCREEN-001
title: Mobile adopter adoption list screen
status: done
---

# Work-Item: MOBILE-ADOPTION-DONOR-LIST-SCREEN-001 — Mobile Adopter Adoption List Screen

## Goal

Create the adopter's own adoption applications list at `/adocoes` wired to
`createMobileAdoptionDonorListUi`. Auth-gated — redirects to `/entrar` on unauthenticated failure.

## States

- `idle/loading` — spinner while fetching
- `empty` — no applications yet; link to `/animais` to browse pets
- `failed` (unauthenticated) — "Entrar na conta" button
- `failed` (other) — retry button
- `loaded` — tappable cards, each navigating to `/adocoes/[applicationId]`

## Affected Files

- `docs/work-items/MOBILE-ADOPTION-DONOR-LIST-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/adocoes/index.tsx` — adopter adoption list screen
- `tests/mobile/adoption-donor-list-screen.test.ts` — boundary contract tests

## Contract

- No route params — `loadDonorAdoptions()` called with no args
- Cards show: petId, status badge (color-coded), submittedAt date
- Tap navigates to `/adocoes/[applicationId]`

## Completion Notes

5 boundary contract tests pass (loaded, loaded-fields, empty, failed-canRetry, getInitialState).
Screen uses directory-based routing (`adocoes/index.tsx`) to coexist with `[applicationId].tsx`.
