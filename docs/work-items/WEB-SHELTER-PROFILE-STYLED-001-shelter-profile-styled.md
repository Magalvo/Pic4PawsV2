---
id: WEB-SHELTER-PROFILE-STYLED-001
title: Web shelter profile page — Tailwind v4 styling
status: done
pr: 305
---

# Work-Item: WEB-SHELTER-PROFILE-STYLED-001 — Web Shelter Profile Page (Styled)

## Goal

Apply Tailwind v4 brand tokens to `apps/web/app/abrigos/[shelterId]/page.tsx`, matching
the design quality established by SCREENS-ONBOARDING-FEED-001 (PR #303). No new data
boundaries — uses the existing `createWebShelterProfileUi` loaded state.

## States

- `null` (loading) — animated pulse skeleton with emoji placeholder
- `loaded` — hero banner, kind/verification badges, contact card, description, nav links
- `not_found` — centred 404 state with back link
- `failed` — centred error state with back link
- `idle` — defensive fallback (same layout as failed)

## Contract

Pure UI change to `apps/web/app/abrigos/[shelterId]/page.tsx`. No logic changes, no new
imports beyond what the file already used.

## Affected Files

- `apps/web/app/abrigos/[shelterId]/page.tsx` — styled
- `docs/work-items/WEB-SHELTER-PROFILE-STYLED-001-shelter-profile-styled.md` (this file)
