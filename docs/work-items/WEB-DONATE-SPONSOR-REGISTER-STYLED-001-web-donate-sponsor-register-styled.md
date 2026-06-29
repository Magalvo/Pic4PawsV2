---
id: WEB-DONATE-SPONSOR-REGISTER-STYLED-001
title: Style web shelter registration, donation form, and sponsorship form
status: done
pr: 0
---

# Work-Item: WEB-DONATE-SPONSOR-REGISTER-STYLED-001

## Goal

Apply Tailwind v4 brand tokens to the three high-impact public-facing web pages that
were unstyled bare HTML: shelter registration, donation form, and sponsorship form.

## States

- pending: all three pages use bare `<main>`, `<h1>`, `<p>`, `<button>` with no Tailwind
  classes — visually identical to browser defaults
- done: all three pages match the app's visual language with card sections, brand colours,
  and appropriate success/error state cards

## Contract

Logic is unchanged in all three pages. Only presentation changes.

- `abrigos/registar/page.tsx` — two-section card form (Informações básicas / Contacto
  público), name + kind select + city/district grid, optional contact fields + description
  textarea, teal submit CTA; registered (success) + failed state cards.
- `abrigos/[shelterId]/doar/page.tsx` — amount field with € prefix, kind chip selector
  (Doação única / Mensal), payment method chip grid (MB Way / Multibanco / Cartão /
  Transferência), conditional MB Way phone field, GDPR consent checkbox, orange submit CTA;
  submitted (receipt card), submitted_automated (Multibanco entity+ref / MB Way phone /
  bank_transfer IBAN receipt card), failed state cards.
- `abrigos/[shelterId]/apadrinhar/page.tsx` — amount field with € prefix, interval
  selector list (Mensal / Trimestral / Anual) with teal active state, teal submit CTA;
  submitting / submitted / failed state cards.

## Affected Files

- `apps/web/app/abrigos/registar/page.tsx` — shelter registration form
- `apps/web/app/abrigos/[shelterId]/doar/page.tsx` — donation form
- `apps/web/app/abrigos/[shelterId]/apadrinhar/page.tsx` — sponsorship form
- `docs/work-items/WEB-DONATE-SPONSOR-REGISTER-STYLED-001-web-donate-sponsor-register-styled.md` (this file)
