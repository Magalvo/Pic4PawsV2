---
id: MOBILE-ADOPTION-SCREEN-001
title: Mobile adoption form screen
status: done
---

# Work-Item: MOBILE-ADOPTION-SCREEN-001 — Mobile Adoption Form Screen

## Goal

Create the adoption form screen at `/animais/[petId]/adotar` wired to `createMobileAdoptionUi`.
Auth-gated — access token retrieved from Supabase session.

Also restructures `animais/[petId].tsx` → `animais/[petId]/index.tsx` to allow Expo Router
nested routes under `[petId]/`.

## States

- `idle` — form ready for input
- `submitting` (local flag) — request in-flight
- `submitted` — success confirmation
- `pet_not_found` — animal no longer available
- `failed` — network or auth error (unauthenticated links to /entrar)

## Affected Files

- `docs/work-items/MOBILE-ADOPTION-SCREEN-001-mobile-adoption-screen.md` (this file)
- `apps/mobile/app/animais/[petId]/index.tsx` — pet profile screen (renamed from `[petId].tsx`)
- `apps/mobile/app/animais/[petId]/adotar.tsx` — new adoption form screen
- `tests/mobile/adoption-screen.test.ts` — boundary contract tests

## Contract

- Calls `createMobileAdoptionUi({ adoptionApplicationClient })` where client uses Supabase session token
- `submitApplication(input)` with all required fields; passes `petId` from route params
- `dataProcessingAccepted` and `shelterContactAccepted` must both be true before submit is enabled
- Unauthenticated failure renders a link to `/entrar`

## Completion Notes

Restructured `animais/[petId].tsx` → `animais/[petId]/index.tsx` (same content, updated
relative import paths, explicit `loaded` state guard added to match E4 pattern). The tracked
`[petId].tsx` was removed via `git rm`.

`apps/mobile/app/animais/[petId]/adotar.tsx` wires `createMobileAdoptionUi` to a scrollable
React Native form. Supabase session is read via `supabase.auth.getSession()` on submit to
obtain the access token. Both GDPR consent switches must be enabled before the submit button
is active. Outcomes: `submitted` → success card + back nav; `pet_not_found` → redirect to
feed; `failed` + `unauthenticated` → link to `/entrar`.

6 boundary contract tests in `tests/mobile/adoption-screen.test.ts` pass against the
existing `createMobileAdoptionUi` boundary.
