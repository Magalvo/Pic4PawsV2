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

## Contract

- `shelterId` from `useLocalSearchParams`; passed to `ui.loadApplications(shelterId)`
- Cards show: applicantFullName, status badge (color-coded), applicantCity, applicantEmail, submittedAt
- `forbidden` state links to `/entrar`; `failed` state has retry button
- All 8 `AdoptionApplicationStatus` values mapped to PT-PT labels

## Completion Notes

6 boundary contract tests pass (loaded, loaded-fields, empty, forbidden, failed-canRetry, getInitialState).
Status color map: submitted → blue, approved → green, rejected → red, under_review → amber.
