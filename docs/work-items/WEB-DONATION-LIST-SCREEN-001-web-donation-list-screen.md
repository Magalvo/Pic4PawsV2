---
id: WEB-DONATION-LIST-SCREEN-001
title: Web shelter donation list page
status: done
---

# Work-Item: WEB-DONATION-LIST-SCREEN-001 — Web Shelter Donation List Page

## Goal

Shelter donation list page at `/abrigos/[shelterId]/doacoes` wired to
`createWebDonationListUi`. Shelter-manager only — auth-gated, forbidden state.

## States

- `null` / loading — loading message with `aria-live="polite"`
- `loaded` — `<ul>` with amount, status, kind, payment method, donor name, date
- `empty` — no donations yet
- `forbidden` — not a shelter member; link to `/entrar`
- `failed` — network/auth error with retry button

## Affected Files

- `docs/work-items/WEB-DONATION-LIST-SCREEN-001-web-donation-list-screen.md`
- `apps/web/app/abrigos/[shelterId]/doacoes/page.tsx`
- `tests/web/donation-list-screen.test.ts`

## Contract

- `shelterId` from `use(params)` (Next.js App Router); passed to `ui.loadDonations(shelterId)`
- List items show: amountCents/100 + currency, status label, kind label, payment method, donorDisplayName, date
- All PT-PT label maps for status, kind, and payment method

## Completion Notes

5 boundary contract tests pass (loaded, loaded-fields, empty, forbidden, failed). Uses
`createWebDonationListUi` from `apps/web/src/donation-list`.
