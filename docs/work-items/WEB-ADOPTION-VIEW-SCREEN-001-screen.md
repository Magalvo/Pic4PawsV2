---
id: WEB-ADOPTION-VIEW-SCREEN-001
title: Web adoption view detail page
status: done
---

# Work-Item: WEB-ADOPTION-VIEW-SCREEN-001 — Web Adoption View Detail Page

## Goal

Create the adopter's adoption application detail view at `/adocoes/[applicationId]` wired to
`createWebAdoptionViewUi`. Shows status, links to pet profile and shelter.

## States

- `idle/loading` — loading message with `aria-live="polite"`
- `not_found` — application not found; link back to `/adocoes`
- `forbidden` — not owner; link to `/entrar`
- `failed` — retry button; unauthenticated also shows `/entrar` link
- `loaded` — `<dl>` with status label, pet link (when petId present), shelter link

## Affected Files

- `docs/work-items/WEB-ADOPTION-VIEW-SCREEN-001-screen.md` (this file)
- `apps/web/app/adocoes/[applicationId]/page.tsx` — adoption view page
- `tests/web/adoption-view-screen.test.ts` — boundary contract tests

## Contract

- `applicationId` from `use(params)` (Next.js App Router pattern)
- `loaded` state exposes `application.applicationStatus`, `application.petId`, `application.shelterId`
- `petId` may be null — conditional `<dt>/<dd>` pair rendered only when present

## Completion Notes

4 boundary contract tests pass (loaded, loaded-applicationId-and-status, not_found, failed).
Uses `createWebAdoptionViewUi` from `apps/web/src/adoption-view`.
