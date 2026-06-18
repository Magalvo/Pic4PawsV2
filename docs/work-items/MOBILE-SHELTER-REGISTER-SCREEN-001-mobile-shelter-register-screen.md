---
id: MOBILE-SHELTER-REGISTER-SCREEN-001
title: Mobile shelter registration screen
status: done
---

# Work-Item: MOBILE-SHELTER-REGISTER-SCREEN-001 — Mobile Shelter Registration Screen

## Goal

Create the shelter registration screen at `/abrigos/registar` wired to
`createMobileShelterRegistrationUi`. Auth-gated — access token from Supabase session on submit.

## States

- `idle` — form ready (name, kind, city, district, email, phone, description)
- `submitting` (local flag) — request in-flight
- `registered` — success card with link to the new shelter profile
- `failed` — network/auth/validation error; unauthenticated links to /entrar; retry resets to idle

## Affected Files

- `docs/work-items/MOBILE-SHELTER-REGISTER-SCREEN-001-mobile-shelter-register-screen.md` (this file)
- `apps/mobile/app/abrigos/registar.tsx` — new shelter registration screen
- `tests/mobile/shelter-register-screen.test.ts` — boundary contract tests

## Contract

- `name` and `city` are required fields (submit disabled while empty)
- `kind` selector: shelter / sanctuary / association / foster_network
- Optional: district, publicEmail, publicPhone, description
- Calls `createMobileShelterRegistrationUi({ shelterRegistrationClient })` with Supabase session

## Completion Notes

7 boundary contract tests pass. Screen follows the form pattern (adotar/doar). Kind selection
via TouchableOpacity buttons. All optional fields nullable — passed as `null` when blank.
Registered state navigates to `/abrigos/[shelterId]`; failed+unauthenticated links to `/entrar`.
