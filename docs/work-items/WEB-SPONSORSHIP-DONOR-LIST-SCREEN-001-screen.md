---
id: WEB-SPONSORSHIP-DONOR-LIST-SCREEN-001
title: Web adopter sponsorship donor list page
status: done
---

# Work-Item: WEB-SPONSORSHIP-DONOR-LIST-SCREEN-001 — Web Adopter Sponsorship Donor List Page

## Goal

Create the adopter's own sponsorship list at `/patrocinios` wired to
`createWebSponsorshipDonorListUi`. Shows recurring sponsorships with links to manage screen.

## States

- `idle/loading` — loading message with `aria-live="polite"`
- `empty` — no sponsorships yet
- `failed` (unauthenticated) — link to `/entrar`; retry button
- `failed` (other) — retry button only
- `loaded` — `<ul>` with links to `/patrocinios/[sponsorshipId]`, amount, interval, status, date

## Affected Files

- `docs/work-items/WEB-SPONSORSHIP-DONOR-LIST-SCREEN-001-screen.md` (this file)
- `apps/web/app/patrocinios/page.tsx` — adopter sponsorship list page
- `tests/web/sponsorship-donor-list-page.test.ts` — boundary contract tests

## Contract

- No route params — `loadDonorSponsorships()` called with no args
- Each item links to `/patrocinios/[sponsorshipId]` for management

## Completion Notes

3 boundary contract tests pass (loaded, empty, failed).
