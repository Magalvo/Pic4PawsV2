---
id: MOBILE-SPONSORSHIP-DONOR-LIST-SCREEN-001
title: Mobile adopter sponsorship donor list screen
status: done
---

# Work-Item: MOBILE-SPONSORSHIP-DONOR-LIST-SCREEN-001 — Mobile Adopter Sponsorship Donor List Screen

## Goal

Create the adopter's own sponsorship list at `/patrocinios` wired to
`createMobileSponsorshipDonorListUi`. Shows recurring sponsorships with amount, interval, status.

## States

- `idle/loading` — spinner while fetching
- `empty` — no sponsorships yet
- `failed` (unauthenticated) — "Entrar na conta" button
- `failed` (other) — retry button
- `loaded` — tappable cards navigating to `/patrocinios/[sponsorshipId]`

## Affected Files

- `docs/work-items/MOBILE-SPONSORSHIP-DONOR-LIST-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/patrocinios/index.tsx` — adopter sponsorship list screen
- `tests/mobile/sponsorship-donor-list-screen.test.ts` — boundary contract tests

## Contract

- No route params — `loadDonorSponsorships()` called with no args
- Cards show: amountCents/100 + currency, recurringInterval, status badge (color-coded), petId if present, createdAt
- Tap navigates to `/patrocinios/[sponsorshipId]`

## Completion Notes

5 boundary contract tests pass (loaded, loaded-fields, empty, failed-canRetry, getInitialState).
Labels: STATUS_LABELS (active/cancelled/paused), INTERVAL_LABELS (monthly/quarterly/annual).
