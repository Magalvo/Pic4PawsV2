---
id: MOBILE-SCREENS-PARITY-001
title: Mobile screen parity — pet feed, pet profile, auth screens
status: done
pr: 306
---

# Work-Item: MOBILE-SCREENS-PARITY-001 — Mobile Screen Parity

## Goal

Apply brand styling (from `packages/ui` brandTokens) to the four unstyled mobile screens,
matching the design quality established by SCREENS-ONBOARDING-FEED-001 (web PR #303) and
FOUNDATION-UI-001 (PR #302 mobile tab bar).

## Screens

1. **Pet feed** (`(app)/(tabs)/animais/index.tsx`) — 2-column FlatList card grid with
   species emoji placeholder, Disponível badge, card press navigates to pet detail
2. **Pet profile** (`animais/[petId]/index.tsx`) — hero gradient with emoji, medical
   badges row, sticky bottom CTA bar (Apadrinha teal + Adoptar orange)
3. **Login** (`(auth)/entrar.tsx`) — orange primary CTA, forgot-password link, sign-up
   crosslink; consistent with web entrar page styling
4. **Register** (`(auth)/registar.tsx`) — orange primary CTA; all other logic unchanged

## Contract

Pure UI changes. No new data boundaries, no new client calls, no logic changes.
Uses existing view model types and existing `brandTokens` values directly.

## Affected Files

- `apps/mobile/app/(app)/(tabs)/animais/index.tsx`
- `apps/mobile/app/animais/[petId]/index.tsx`
- `apps/mobile/app/(auth)/entrar.tsx`
- `apps/mobile/app/(auth)/registar.tsx`
- `docs/work-items/MOBILE-SCREENS-PARITY-001-mobile-screens-parity.md` (this file)
