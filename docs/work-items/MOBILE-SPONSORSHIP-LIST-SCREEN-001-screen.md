---
id: MOBILE-SPONSORSHIP-LIST-SCREEN-001
title: Mobile shelter sponsorship list screen
status: done
---

# Work-Item: MOBILE-SPONSORSHIP-LIST-SCREEN-001 — Mobile Shelter Sponsorship List Screen

## Goal

Create the shelter manager's received sponsorships list at `/abrigos/[shelterId]/patrocinios`
wired to `createMobileSponsorshipListUi`. Read-only view of all active/cancelled/paused sponsors.

## States

- `idle/loading` — spinner while fetching
- `empty` — no sponsorships for this shelter
- `forbidden` — user is not a shelter member; link to `/entrar`
- `failed` — network error; retry button
- `loaded` — list of sponsorship cards (read-only, no tap action)

## Affected Files

- `docs/work-items/MOBILE-SPONSORSHIP-LIST-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/patrocinios.tsx` — shelter sponsorship list screen
- `tests/mobile/sponsorship-list-screen.test.ts` — boundary contract tests

## Contract

- `shelterId` from `useLocalSearchParams`; passed to `ui.loadSponsorships(shelterId)`
- Cards show: amountCents/100, currency, recurringInterval, status badge, petId if present, createdAt
- Follows same shelter-scoped pattern as `candidaturas.tsx` and `doacoes.tsx`

## Completion Notes

6 boundary contract tests pass (loaded, loaded-fields, empty, forbidden, failed-canRetry, getInitialState).
