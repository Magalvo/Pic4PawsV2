---
id: WEB-ADOPTION-LIST-SCREEN-001
title: Web shelter adoption list page
status: done
---

# Work-Item: WEB-ADOPTION-LIST-SCREEN-001 — Web Shelter Adoption List Page

## Goal

Shelter adoption list page at `/abrigos/[shelterId]/candidaturas` wired to
`createWebAdoptionListUi`. Shelter-manager only — auth-gated, forbidden state.

## States

- `null` / loading — loading message with `aria-live="polite"`
- `loaded` — `<ul>` with applicant name, status, city, email, date
- `empty` — no applications yet
- `forbidden` — not a shelter member; link to `/entrar`
- `failed` — network/auth error with retry button

## Affected Files

- `docs/work-items/WEB-ADOPTION-LIST-SCREEN-001-web-adoption-list-screen.md`
- `apps/web/app/abrigos/[shelterId]/candidaturas/page.tsx`
- `tests/web/adoption-list-screen.test.ts`

## Contract

- `shelterId` from `use(params)` (Next.js App Router); passed to `ui.loadApplications(shelterId)`
- List items show: applicantFullName, status label (PT-PT), applicantCity, applicantEmail, submittedAt
- `forbidden` links to `/entrar`

## Completion Notes

5 boundary contract tests pass (loaded, loaded-fields, empty, forbidden, failed). Uses
`createWebAdoptionListUi` from `apps/web/src/adoption-list`.
