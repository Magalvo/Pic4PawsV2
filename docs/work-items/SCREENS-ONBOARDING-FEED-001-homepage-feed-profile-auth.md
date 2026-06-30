---
id: SCREENS-ONBOARDING-FEED-001
title: Homepage role cards, pet feed grid, pet profile, auth forms
status: done
---

# Work-Item: SCREENS-ONBOARDING-FEED-001 — Homepage, Pet Feed, Pet Profile, Auth Screens

## Context & Problem

After FOUNDATION-UI-001 installed Tailwind and the global nav, all page content was still
bare HTML. Four key screens — the public homepage, pet feed grid, pet profile detail, and
auth forms — needed brand-styled implementations using the Tailwind v4 token set so the
app felt production-ready end-to-end.

## Goal

Style the homepage, pet feed, pet profile, and auth screens with brand tokens so the full
public-facing discovery loop (homepage → feed → profile → auth) is visually complete.

## States

No new ViewModel states. Pure UI layer change over existing product boundaries.

## Contract

### Homepage (`/`)
- Replace generic hero with two role-selection cards: Adopter (orange) and Shelter (teal).
- Include eyebrow text, `<h1>`, subtitle, and footer Termos/Privacidade strip.

### Pet feed (`/animais`)
- Responsive card grid: 1 col mobile → 2 col sm → 3 col lg.
- 4:5 aspect image area with species emoji placeholder, `Disponível` pill badge,
  Adoptar (orange) and Apadrinha (teal) CTA buttons per card.

### Pet profile (`/animais/[petId]`)
- 4:5 hero placeholder with gradient; `Disponível para adopção` status overlay.
- Pet name, species label, location, shelter link.
- Optional description and medical badge row (Vacinado/Esterilizado/Microchipado).
- Sponsorship teaser card (teal-light); sticky bottom CTA bar (Apadrinha teal + Adoptar orange).

### Auth forms (`/entrar`, `/registar`)
- Card-style forms with brand input fields (focus ring, transition).
- Orange submit CTA; error alert; forgot-password and inter-page links. Auth logic unchanged.

### styles.css
- Trim old homepage-only classes; keep root + Tailwind `@theme` block only.

## Acceptance Criteria

- [x] Homepage shows two role-selection cards with orange (Adopter) and teal (Shelter) styling.
- [x] Pet feed renders a responsive 1→2→3 col card grid with 4:5 placeholder, badge, and CTAs.
- [x] Pet profile has 4:5 hero, name + meta, medical badges, teaser, and sticky CTA bar.
- [x] `/entrar` and `/registar` are styled card forms; auth logic unchanged.
- [x] `styles.css` trimmed to `@theme` block only.
- [x] All copy PT-PT.
- [x] All existing tests pass.

## Non-Goals

- Do not add real image loading (placeholder emojis only — MEDIA-URL-WORKER-001 handles images).
- Do not change auth logic, Worker routes, or database.

## Affected Files

- `docs/work-items/SCREENS-ONBOARDING-FEED-001-homepage-feed-profile-auth.md` (this file)
- `apps/web/app/page.tsx`
- `apps/web/app/animais/page.tsx`
- `apps/web/app/animais/[petId]/page.tsx`
- `apps/web/app/entrar/page.tsx`
- `apps/web/app/registar/page.tsx`
- `apps/web/app/styles.css`

## Completion Notes

Implemented in PR #303 (`agent/SCREENS-ONBOARDING-FEED-001`), merged 2026-06-29.
