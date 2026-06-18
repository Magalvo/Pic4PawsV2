---
id: MOBILE-DONATION-LIST-SCREEN-001
title: Mobile shelter donation list screen
status: done
---

# Work-Item: MOBILE-DONATION-LIST-SCREEN-001 — Mobile Shelter Donation List Screen

## Goal

Shelter donation list screen at `/abrigos/[shelterId]/doacoes` wired to
`createMobileDonationListUi`. Shelter-manager only — auth-gated, forbidden state.

## States

- `null` / loading — spinner
- `loaded` — scrollable list of donations (amount, status, kind, method, donor, date)
- `empty` — no donations yet
- `forbidden` — not a member of this shelter
- `failed` — network/auth error with retry

## Affected Files

- `docs/work-items/MOBILE-DONATION-LIST-SCREEN-001-mobile-donation-list-screen.md`
- `apps/mobile/app/abrigos/[shelterId]/doacoes.tsx`
- `tests/mobile/donation-list-screen.test.ts`
