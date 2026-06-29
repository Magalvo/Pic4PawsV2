---
id: WEB-PET-DRAFT-STYLED-001
title: Web pet draft form — styled with brand tokens
status: done
pr: 0
---

# Work-Item: WEB-PET-DRAFT-STYLED-001 — Web Pet Draft Form Styled

## Goal

Apply Tailwind v4 brand styling to the three pet draft pages (`novo`, `editar`, `guardar`),
replacing bare HTML with the design-system look: dashed orange drop-zone, species chip pills,
medical toggle pills, styled inputs, and sticky orange publish CTA.

## States

- pending: all three draft pages use plain unstyled HTML (bare inputs, checkboxes, buttons)
- done: all three pages share consistent brand styling — dashed-border photo zone, species
  chip pills (orange when selected), medical toggle pills (teal when active), styled text
  inputs with focus rings, sticky bottom CTA bar with orange primary button

## Contract

Pure UI changes. No new data boundaries, no new client calls, no logic changes.
Uses existing view model types and existing Tailwind v4 theme tokens from `@theme {}`.

Species selector changed from `<select>` to chip pills on all three pages.
Medical toggles changed from `<input type="checkbox">` to toggle pills on all three pages.
`guardar/page.tsx` photo `<input type="file">` restyled as a clickable drop-zone area.

## Affected Files

- `apps/web/app/animais/rascunhos/novo/page.tsx`
- `apps/web/app/animais/rascunhos/[petId]/editar/page.tsx`
- `apps/web/app/animais/rascunhos/[petId]/guardar/page.tsx`
- `docs/work-items/WEB-PET-DRAFT-STYLED-001-web-pet-draft-styled.md` (this file)
