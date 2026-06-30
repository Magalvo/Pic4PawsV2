---
id: WEB-SHELTER-MGMT-NOTIF-STYLED-001
title: Apply Tailwind v4 brand styling to 11 shelter-mgmt and notification pages
status: done
---

# Work-Item: WEB-SHELTER-MGMT-NOTIF-STYLED-001 — Shelter Management & Notification Pages Styled

## Context & Problem

After PRs #305–#312 styled shelter profile, mobile parity, pet draft, media upload, adoption,
candidaturas, donation, sponsorship, and registration screens, 11 pages remained as bare HTML:
shelter management (doacoes, patrocinios, financeiro, membros, editar, eliminar, pagamento,
verificar) and user pages (notificacoes, notificacoes/preferencias, adocoes).

## Goal

Style all 11 remaining web pages with Tailwind v4 brand tokens following the established
pattern from PRs #310–#312 so every page in the web app has consistent brand styling.

## States

No new ViewModel states. UI layer only; all product-boundary logic unchanged.

## Contract

All pages use `rounded-card` containers, `rounded-pill` status badges, `rounded-control`
inputs, `rounded-cta` primary CTAs, and brand colours from `styles.css @theme`.

- **Doacoes** — amount, status badge (paid=teal, pending=amber, failed=red), payment method, retry button.
- **Patrocinios** — interval badge (active=teal).
- **Financeiro** — two metric stat cards (total donations orange, active sponsorships teal);
  `forbidden` state shows hardcoded "Acesso restrito" (type has no `title` on forbidden state).
- **Membros** — add-member form, member list with role badge, red remove buttons (owner protected).
- **Editar** — 2-col form grid prefilled from `loadProfile()`, `kind` select, link to verificar.
- **Eliminar** — red-border danger zone, `router.replace('/abrigos')` on success.
- **Pagamento** — IBAN + MB WAY fields pre-filled via `uiRef` lazy-init pattern.
- **Verificar** — dual-role panel: owner gets "Submeter para revisão" (teal); admin gets teal/amber/slate actions.
- **Notificacoes** — unread dot (orange dot + highlighted bg), per-item mark-read button.
- **Preferencias** — CSS-only toggle (no extra deps): `rounded-pill` spans + `sr-only` checkbox,
  `translate-x-4` driven by `pref.enabled`.
- **Adocoes** — clickable card rows → `/adocoes/[id]`; status badges: approved=teal,
  submitted/under_review=amber, rejected/expired=muted.

## Acceptance Criteria

- [x] All 11 pages use Tailwind v4 brand tokens consistently.
- [x] Status badge colours match semantics (teal=positive, amber=pending, red=failed/danger).
- [x] `forbidden` state on financeiro shows "Acesso restrito" without a missing `title` field.
- [x] Custom CSS-only toggle on preferencias (no new JS dependency).
- [x] All copy PT-PT.
- [x] `npm run typecheck`, `npm run lint`, `npm run test` pass.

## Non-Goals

- Do not change product-boundary logic, Worker routes, or database.
- Do not add new states to any view model.

## Affected Files

- `docs/work-items/WEB-SHELTER-MGMT-NOTIF-STYLED-001-shelter-mgmt-notif-styled.md` (this file)
- `apps/web/app/abrigos/[shelterId]/doacoes/page.tsx`
- `apps/web/app/abrigos/[shelterId]/patrocinios/page.tsx`
- `apps/web/app/abrigos/[shelterId]/financeiro/page.tsx`
- `apps/web/app/abrigos/[shelterId]/membros/page.tsx`
- `apps/web/app/abrigos/[shelterId]/editar/page.tsx`
- `apps/web/app/abrigos/[shelterId]/eliminar/page.tsx`
- `apps/web/app/abrigos/[shelterId]/pagamento/page.tsx`
- `apps/web/app/abrigos/[shelterId]/verificar/page.tsx`
- `apps/web/app/notificacoes/page.tsx`
- `apps/web/app/notificacoes/preferencias/page.tsx`
- `apps/web/app/adocoes/page.tsx`

## Completion Notes

Implemented in PR #313 (`agent/WEB-SHELTER-MGMT-NOTIF-STYLED-001`), merged 2026-06-30.
