# WEB-LANDING-001 — Real Home Landing Page

## Goal

Replace the dev status dashboard at `apps/web/app/page.tsx` with a real public landing
page for Pic4Paws. The page introduces the platform to adopters, shelters, and sponsors
with PT-PT copy, two primary CTAs (Criar conta → /registar, Entrar → /entrar), and three
feature cards. Updates `webFoundationContent.hero.eyebrow` and `primaryAction` to
production-ready values.

## States

No state machine — the page is a pure server component (no `'use client'`). All content
is static; no async data fetching.

## Contract

No new boundary, client, or worker route. Changes are limited to the page file, the
foundation content object, and the shared stylesheet.

## Affected files

- `docs/work-items/WEB-LANDING-001-web-landing-page.md` (this file)
- `apps/web/app/page.tsx` (replace dev dashboard with landing page)
- `apps/web/src/foundation.ts` (update hero.eyebrow + primaryAction)
- `apps/web/app/styles.css` (add .cta-group, .btn-primary, .btn-secondary, .feature-card, .features, .privacy-note)

## Acceptance criteria

- Page at `/` renders hero with eyebrow, title, lead text from `webFoundationContent`
- Primary CTA links to `/registar` with label from `primaryAction.label`
- Secondary CTA links to `/entrar`
- Three feature cards: adotantes, abrigos, padrinhos — PT-PT copy
- Privacy note section present
- Dev status dashboard (readiness grid, contract-ready labels) removed
- `webFoundationContent.primaryAction.href` updated to `/registar`
- `webFoundationContent.hero.eyebrow` updated to production-ready copy
