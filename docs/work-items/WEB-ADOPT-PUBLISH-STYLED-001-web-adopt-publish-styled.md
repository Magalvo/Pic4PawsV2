---
id: WEB-ADOPT-PUBLISH-STYLED-001
title: Style web adopt + publish pages with brand tokens
status: done
pr: 0
---

# Work-Item: WEB-ADOPT-PUBLISH-STYLED-001 — Style Web Adopt & Publish Pages

## Goal

Apply Tailwind v4 brand tokens to the three unstyled web pages in the adopt/publish
flow so the user experience is consistent with the rest of the app.
Mobile equivalents already carry brand styling and are out of scope.

## States

- pending: three web pages use bare `<main>`, `<h1>`, `<p>`, `<button>` with no Tailwind
  classes — visually identical to browser defaults
- done: all three pages use brand card layout, brand colours (`bg-primary`, `bg-teal`,
  `text-ink`, `border-border`, etc.) and match the visual language of PR #307

## Contract

Logic is unchanged in all three pages. Only presentation changes.

- `abrigos/[shelterId]/animais/page.tsx` gains: status badge colours, species emoji,
  "Editar" + "Publicar" action links for draft pets, "Ver perfil" link for live pets.
- `animais/[petId]/publicar/page.tsx` gains: centered confirmation card for each state
  (ready / publishing / published / failed) with appropriate icons and CTAs.
- `animais/[petId]/adotar/page.tsx` gains: sectioned form card layout (Dados pessoais /
  Habitação e contexto / Experiência e motivação / Consentimento), styled inputs, divider
  toggles, GDPR consent checkboxes, disabled-state submit button.

## Affected Files

- `apps/web/app/abrigos/[shelterId]/animais/page.tsx` — shelter pet list with publish links
- `apps/web/app/animais/[petId]/publicar/page.tsx` — publish confirmation card
- `apps/web/app/animais/[petId]/adotar/page.tsx` — adoption application form
- `docs/work-items/WEB-ADOPT-PUBLISH-STYLED-001-web-adopt-publish-styled.md` (this file)
- `docs/checkpoints/2026-06-29-pet-images-complete.md` — checkpoint closing the UI track
