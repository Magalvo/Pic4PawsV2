---
id: MOBILE-DONATION-STATUS-SCREEN-001
title: Mobile donation status screen
status: done
---

# Work-Item: MOBILE-DONATION-STATUS-SCREEN-001 — Mobile Donation Status Screen

## Goal

Create the donation status screen at `/doacoes/[donationId]` wired to `createMobileDonationStatusUi`.
Auth-gated — access token retrieved from Supabase session on load.

## States

- `idle` / `null` — loading indicator
- `loaded` — donation details card (amount, status, payment method, date, link to shelter)
- `not_found` — donation missing
- `forbidden` — access denied, link to /entrar
- `failed` — network/auth error; unauthenticated links to /entrar; retry clears state

## Affected Files

- `docs/work-items/MOBILE-DONATION-STATUS-SCREEN-001-mobile-donation-status-screen.md` (this file)
- `apps/mobile/app/doacoes/[donationId].tsx` — new donation status screen
- `tests/mobile/donation-status-screen.test.ts` — boundary contract tests

## Contract

- `donationId` from `useLocalSearchParams`
- `createDonationStatusClient` with Supabase session token via `getSession()` in `useEffect`
- Amount displayed as `(amountCents / 100).toFixed(2) currency`
- PT-PT labels for `kind`, `donationStatus`, `paymentMethod`
- Retry reloads the screen by resetting viewModel to null

## Completion Notes

7 boundary contract tests pass. Screen loaded via `useEffect` on mount (read pattern, not form).
All 6 viewModel states handled with explicit guards. Link to abrigo on `loaded` state.
