---
id: WEB-SPONSORSHIP-SCREEN-001
title: Web sponsorship submission page
status: done
---

# Work-Item: WEB-SPONSORSHIP-SCREEN-001 — Web Sponsorship Submission Page

## Goal

Create the sponsorship submission page at `/abrigos/[shelterId]/apadrinhar` wired to
`createWebSponsorshipUi`. Lets adopters initiate a recurring sponsorship for a shelter.

## States

- `idle` — form with amount (number input, euros) + recurring interval radio group (monthly/quarterly/annual)
- `submitting` — loading message while API call is in flight
- `submitted` — success message with sponsorship details
- `failed` — error message with retry button

## Affected Files

- `docs/work-items/WEB-SPONSORSHIP-SCREEN-001-screen.md` (this file)
- `apps/web/app/abrigos/[shelterId]/apadrinhar/page.tsx` — sponsorship page
- `tests/web/sponsorship-page.test.ts` — boundary contract tests

## Contract

- Import depth from `apps/web/`: 4 levels → `../../../../src/`
- `shelterId` from `use(params)`
- `IDLE: WebSponsorshipIdleState` constant (module-level) to avoid stale closures
- `createSponsorshipClient({ sponsorshipsPath: '/sponsorships', ... })`
- Amount entered in euros; converted to cents: `Math.round(parsed * 100)`
- `paymentMethod: 'card'` (hardcoded)
- `SponsorshipClientInput = { shelterId, amountCents, paymentMethod, recurringInterval }`

## Completion Notes

3 boundary contract tests pass (idle, submitted, failed). Typecheck clean.
