---
id: MOBILE-SPONSORSHIP-SCREEN-001
title: Mobile sponsorship submission screen
status: done
---

# Work-Item: MOBILE-SPONSORSHIP-SCREEN-001 — Mobile Sponsorship Submission Screen

## Goal

Create the sponsorship submission screen at `/abrigos/[shelterId]/apadrinhar` wired to
`createMobileSponsorshipUi`. Lets adopters initiate a recurring sponsorship for a shelter.

## States

- `idle` — form with amount (decimal-pad input) + recurring interval picker (monthly/quarterly/annual)
- `submitting` — loading indicator while API call is in flight
- `submitted` — success message with sponsorship details
- `failed` — error message with retry button

## Affected Files

- `docs/work-items/MOBILE-SPONSORSHIP-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/apadrinhar.tsx` — sponsorship screen
- `tests/mobile/sponsorship-screen.test.ts` — boundary contract tests

## Contract

- `shelterId` from `useLocalSearchParams`
- `createSponsorshipClient({ sponsorshipsPath: '/sponsorships', ... })`
- Amount entered in euros; converted to cents: `Math.round(parseFloat(amountEuros) * 100)`
- `paymentMethod: 'card'` (hardcoded — only supported method)
- `SponsorshipClientInput = { shelterId, amountCents, paymentMethod, recurringInterval }`
- Success: `status === 'sponsorship_created'`; UI enters `submitted` state

## Completion Notes

5 boundary contract tests pass (idle, submitting, submitted, failed, retry). Typecheck clean.
