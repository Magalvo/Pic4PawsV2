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

## Contract

- `shelterId` from `useLocalSearchParams`; passed to `ui.loadDonations(shelterId)`
- Cards show: amountCents/100 + currency, status, kind, paymentMethod, donorDisplayName, createdAt
- All `DonationClientStatus`, `DonationClientKind`, and `DonationClientPaymentMethod` values mapped to PT-PT
- `forbidden` links to `/entrar`; `failed` has retry button

## Completion Notes

6 boundary contract tests pass (loaded, loaded-fields, empty, forbidden, failed-canRetry, getInitialState).
Label maps: KIND_LABELS, STATUS_LABELS, PAYMENT_LABELS — all PT-PT.
