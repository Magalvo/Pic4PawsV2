---
id: MOBILE-FINANCIALS-SCREEN-001
title: Mobile shelter financials dashboard screen
status: done
---

# Work-Item: MOBILE-FINANCIALS-SCREEN-001 — Mobile Financials Dashboard Screen

## Goal

Create the shelter financial summary screen at `/abrigos/[shelterId]/financeiro` wired to
`createMobileFinancialsDashboardUi`. Shows donation totals and sponsorship metrics.

## States

- `null / idle / loading` — spinner while fetching
- `forbidden` — user is not a shelter member; link to `/entrar`
- `failed` — network error; retry button
- `loaded` — two sections: Doações (paidTotalCents, count) and Apadrinhamentos (activeCount, activeTotalCents)

## Affected Files

- `docs/work-items/MOBILE-FINANCIALS-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/financeiro.tsx` — financials dashboard screen
- `tests/mobile/financials-screen.test.ts` — boundary contract tests

## Contract

- `shelterId` from `useLocalSearchParams`; passed to `ui.loadFinancials(shelterId)`
- Currency amounts displayed as `(cents / 100).toFixed(2) + ' ' + currency`
- `FinancialsClientSummary.sponsorships` has `activeTotalCents` (not `monthlyTotalCents`)

## Completion Notes

4 boundary contract tests pass (loaded, loaded-fields, forbidden, failed). Typecheck clean.
