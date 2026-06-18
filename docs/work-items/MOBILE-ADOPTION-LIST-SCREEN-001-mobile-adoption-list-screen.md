---
id: MOBILE-ADOPTION-LIST-SCREEN-001
title: Mobile shelter adoption list screen
status: done
---

# Work-Item: MOBILE-ADOPTION-LIST-SCREEN-001 — Mobile Shelter Adoption List Screen

## Goal

Shelter adoption list screen at `/abrigos/[shelterId]/candidaturas` wired to
`createMobileAdoptionListUi`. Shelter-manager only — auth-gated, forbidden state.

## States

- `null` / loading — spinner
- `loaded` — scrollable list of applications (name, city, status, date)
- `empty` — no applications yet
- `forbidden` — not a member of this shelter
- `failed` — network/auth error with retry

## Affected Files

- `docs/work-items/MOBILE-ADOPTION-LIST-SCREEN-001-mobile-adoption-list-screen.md`
- `apps/mobile/app/abrigos/[shelterId]/candidaturas.tsx`
- `tests/mobile/adoption-list-screen.test.ts`
