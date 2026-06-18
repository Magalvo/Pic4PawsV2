---
id: MOBILE-DONATION-SCREEN-001
title: Mobile donation form screen
status: done
---

# Work-Item: MOBILE-DONATION-SCREEN-001 — Mobile Donation Form Screen

## Goal

Create the donation form screen at `/abrigos/[shelterId]/doar` wired to `createMobileDonationUi`.
Auth-gated — access token retrieved from Supabase session on submit.

## States

- `idle` — form ready (amount, kind, payment method, GDPR consent)
- `submitting` (local flag) — request in-flight
- `submitted` — success confirmation with amount + currency
- `failed` — network or auth error; unauthenticated links to /entrar

## Affected Files

- `docs/work-items/MOBILE-DONATION-SCREEN-001-mobile-donation-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/doar.tsx` — new donation form screen

## Contract

- `shelterId` from `useLocalSearchParams`
- `amountCents = Math.round(parseFloat(amountEuros) * 100)`, submit disabled when ≤ 0 or GDPR not accepted
- Calls `createMobileDonationUi({ donationClient })` where client uses Supabase session token

## Completion Notes

`apps/mobile/app/abrigos/[shelterId]/doar.tsx` wires `createMobileDonationUi` to a scrollable
React Native form. Supabase session read on submit. Amount entered in euros and converted to
cents. `dataProcessingAccepted` Switch and positive amount gate submission.
Outcomes: `submitted` → success card; `failed+unauthenticated` → link to `/entrar`.
