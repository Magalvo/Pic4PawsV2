---
id: FOUNDATION-UI-001
title: Install Tailwind v4, expand design tokens, wire global nav
status: done
---

# Work-Item: FOUNDATION-UI-001 — Tailwind v4, Design Tokens, Global Nav

## Context & Problem

All web pages used plain unstyled HTML. There was no shared colour palette, typography scale,
or navigation component — each new screen had to invent its own spacing and colours from
scratch, making visual consistency impossible to enforce. Tailwind CSS was not installed.

## Goal

Install Tailwind v4 in the web app, define the full brand token set as CSS custom properties
in a `@theme {}` block, add a sticky `SiteNav` component wired into the root layout, expand
`packages/ui` brand tokens for shared mobile/web reference, and style the mobile tab bar.

## States

No new ViewModel states. UI foundation and infrastructure only.

## Contract

- `apps/web/postcss.config.mjs` — new; wires `@tailwindcss/postcss`.
- `apps/web/app/styles.css` — `@theme {}` block with full brand palette:
  primary `#ec5b13`, teal `#2aa7a2`, surface `#ffffff`, bg `#f8f6f6`,
  ink `#0f172a`, muted `#64748b`, border `#e2e8f0`;
  radii: control 0.5rem, card 0.75rem, pill 1rem, cta 1.5rem.
- `apps/web/src/SiteNav.tsx` — sticky header with logo (`🐾 Pic4Paws`), nav links
  (`/animais`, `/abrigos`), and auth links (`/entrar`, `/registar`).
- `apps/web/app/layout.tsx` — `SiteNav` wired into root layout.
- `packages/ui/src/index.ts` — `brandTokens` expanded with typography scale, weights,
  line-heights, spacing, numeric radii, and React Native shadow presets.
- `apps/mobile/app/(app)/(tabs)/_layout.tsx` — orange active tint, slate inactive,
  white surface, labelled icons on the bottom tab bar.

## Acceptance Criteria

- [x] `tailwindcss` and `@tailwindcss/postcss` installed; `postcss.config.mjs` added.
- [x] `@theme {}` block in `styles.css` defines all brand colours and radii.
- [x] `SiteNav.tsx` added with logo, nav links, auth links.
- [x] `SiteNav` wired into `apps/web/app/layout.tsx`.
- [x] `packages/ui/src/index.ts` `brandTokens` expanded with typography + RN shadows.
- [x] Mobile tab bar styled with brand colours and labelled icons.
- [x] All existing tests pass.

## Non-Goals

- Do not style individual page content — only the global shell and shared tokens.
- Do not add authentication logic.
- Do not change the Worker or database layers.

## Affected Files

- `docs/work-items/FOUNDATION-UI-001-tailwind-v4-design-tokens-nav.md` (this file)
- `apps/web/postcss.config.mjs`
- `apps/web/package.json`
- `apps/web/app/styles.css`
- `apps/web/app/layout.tsx`
- `apps/web/src/SiteNav.tsx`
- `apps/mobile/app/(app)/(tabs)/_layout.tsx`
- `packages/ui/src/index.ts`
- `package-lock.json`
- `docs/ux-ui-gap-analysis.md`

## Completion Notes

Implemented in PR #302 (`agent/FOUNDATION-UI-001`), merged 2026-06-29.
