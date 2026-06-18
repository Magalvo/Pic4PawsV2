---
id: WEB-FINANCIALS-SCREEN-001
title: Web shelter financials dashboard page
status: done
---

# Work-Item: WEB-FINANCIALS-SCREEN-001 — Web Financials Dashboard Page

## Goal

Create the shelter financial summary page at `/abrigos/[shelterId]/financeiro` (Next.js App Router)
wired to `createWebFinancialsDashboardUi`. Shows donation totals and sponsorship metrics in a `<dl>` layout.

## States

- `null / idle / loading` — inline loading text
- `forbidden` — message
- `failed` — message + retry button
- `loaded` — two `<section>` blocks: Doações (paidTotalCents, count) and Apadrinhamentos (activeCount, activeTotalCents)

## Affected Files

- `docs/work-items/WEB-FINANCIALS-SCREEN-001-screen.md` (this file)
- `apps/web/app/abrigos/[shelterId]/financeiro/page.tsx` — financials dashboard page
- `tests/web/financials-page.test.ts` — boundary contract tests

## Contract

- `shelterId` from `use(params)`; passed to `ui.loadFinancials(shelterId)`
- `FinancialsClientSummary.sponsorships` uses `activeTotalCents` (not `monthlyTotalCents`)
- Currency amounts: `(cents / 100).toFixed(2) + ' ' + currency`

## Completion Notes

3 boundary contract tests pass (loaded, forbidden, failed). Typecheck clean.
