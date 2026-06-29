---
id: WEB-CANDIDATURAS-STYLED-001
title: Style web shelter candidaturas pages with brand tokens
status: done
pr: 0
---

# Work-Item: WEB-CANDIDATURAS-STYLED-001 — Style Shelter Candidaturas Pages

## Goal

Apply Tailwind v4 brand tokens to the two unstyled shelter adoption management pages,
completing the adoption loop on the shelter side (adopter form was styled in PR #310).

## States

- pending: both pages are bare `<main>`, `<h1>`, `<p>`, `<button>` elements with no
  Tailwind classes — visually identical to browser defaults
- done: both pages match the visual language of the rest of the app; application list
  shows status badges and "Ver candidatura" links; status management shows
  role-appropriate action buttons with correct colour semantics

## Contract

Logic is unchanged in both pages. Only presentation changes.

- `candidaturas/page.tsx` gains: per-status badge colour map (amber for submitted,
  teal for under_review/approved, orange for more_info_requested, slate for
  rejected/withdrawn/expired), applicant name + city + date + email card layout,
  "Ver candidatura" link to the detail page, empty/forbidden/failed state cards.
- `candidaturas/[applicationId]/page.tsx` gains: four status action buttons with
  semantically coloured outlines (teal outline = in review, amber = info needed,
  teal filled = approve, slate = reject), submitting/succeeded/failed state cards,
  back link to the list.

## Affected Files

- `apps/web/app/abrigos/[shelterId]/candidaturas/page.tsx` — application list
- `apps/web/app/abrigos/[shelterId]/candidaturas/[applicationId]/page.tsx` — status management
- `docs/work-items/WEB-CANDIDATURAS-STYLED-001-web-candidaturas-styled.md` (this file)
