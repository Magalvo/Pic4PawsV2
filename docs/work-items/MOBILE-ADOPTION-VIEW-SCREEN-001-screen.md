---
id: MOBILE-ADOPTION-VIEW-SCREEN-001
title: Mobile adoption view detail screen
status: done
---

# Work-Item: MOBILE-ADOPTION-VIEW-SCREEN-001 — Mobile Adoption View Detail Screen

## Goal

Create the adopter's adoption application detail view at `/adocoes/[applicationId]` wired to
`createMobileAdoptionViewUi`. Shows application status, links to pet profile and shelter.

## States

- `idle/loading` — spinner while fetching
- `not_found` — application not found; back button
- `forbidden` — not the owner; link to `/entrar`
- `failed` — network/other error; retry button
- `loaded` — detail card with status label, pet link, shelter link

## Affected Files

- `docs/work-items/MOBILE-ADOPTION-VIEW-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/adocoes/[applicationId].tsx` — adoption view screen
- `tests/mobile/adoption-view-screen.test.ts` — boundary contract tests

## Contract

- `applicationId` from `useLocalSearchParams`; passed to `ui.loadAdoptionView(applicationId)`
- `loaded` state exposes `application.applicationStatus`, `application.petId`, `application.shelterId`
- `petId` may be null — conditional link rendered only when present

## Completion Notes

6 boundary contract tests pass (loaded, loaded-applicationId-and-status, not_found, forbidden,
failed-canRetry, getInitialState). Status labels mapped to PT-PT for all 8 AdoptionApplicationStatus values.
