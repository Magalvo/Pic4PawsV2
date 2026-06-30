# UX/UI Gap Analysis — Pic4Paws

> Compared against `docs/design-refs/stitch_dual_onboarding` · Last updated 2026-06-30

**Status legend:** None = no styling applied · Partial = some structure but doesn't match design ref · OK = matches design ref

---

## Foundation ✅

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Design tokens (`packages/ui`) | OK | OK | Full `brandTokens` — colours, typography scale + weights, radii (numeric), spacing, RN shadow presets. (PR #302) |
| Tailwind v4 on web | OK | — | `@import "tailwindcss"` + `@theme {}` with all brand variables. PostCSS via `@tailwindcss/postcss`. (PR #302) |
| Web global nav | OK | — | `SiteNav` sticky header: logo, main nav links with active-state highlight, Entrar/Registar auth CTAs. (PR #302) |
| Mobile bottom tab bar | OK | OK | Orange active tint, slate inactive, white surface. Material Icons. (PR #302) |

---

## Onboarding

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Homepage `/` | OK | — | Two role-selection cards (Adopter → orange, Shelter → teal), eyebrow, h1, subtitle, footer strip. (PR #303) |
| Login `/entrar` | OK | OK | Branded card form — focus-ring inputs, forgot-password link, orange CTA, error alert. Web: PR #303. Mobile: PR #306. |
| Registration `/registar` | OK | OK | Branded card form — email/name/password/GDPR, success/failed states styled. Web: PR #303. Mobile: PR #306. |
| Recover password | None | None | Logic complete (Track E, PRs #207–#208). No brand design treatment on either platform. |

---

## Pet Feed ✅

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Feed list `/animais` | OK | OK | Responsive card grid (web 1→2→3 col, mobile 2 col). 4:5 hero with real R2 image + emoji fallback. Disponível badge, Adoptar/Apadrinha CTAs. Web: PR #303+#308. Mobile: PR #306+#309. |
| Pet profile `/animais/[petId]` | OK | OK | 4:5 hero with real R2 image, Disponível overlay, name/species/location, shelter link, medical badge row, sponsorship teaser, sticky CTA bar. Web: PR #303+#308. Mobile: PR #306+#309. |

---

## Shelter ✅

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Shelter profile `/abrigos/[id]` | OK | OK | Hero banner, verification/kind badges, contact card, member links. PR #305. |
| Register shelter `/abrigos/registar` | OK | OK | Kind chip selector, branded form. PR #312. |
| Edit shelter `/abrigos/[id]/editar` | OK | OK | 2-col form grid, kind select, link to verificar. PR #313. |
| Delete shelter `/abrigos/[id]/eliminar` | OK | OK | Red-border danger zone. PR #313. |
| Verify shelter `/abrigos/[id]/verificar` | OK | OK | Dual-role panel (owner submits, admin reviews). PR #313. |
| Members `/abrigos/[id]/membros` | OK | OK | Add-member form, role badge, red remove (owner protected). PR #313. |
| Payment config `/abrigos/[id]/pagamento` | OK | OK | IBAN + MB WAY fields, lazy-init pre-fill. PR #313. |
| Financials `/abrigos/[id]/financeiro` | OK | OK | Two metric stat cards (donations=orange, sponsorships=teal). PR #313. |

---

## Pet Upload / Draft ✅

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| New pet form `/animais/rascunhos/novo` | OK | OK | Species chip grid, medical toggles, photo drop-zone, sticky publish CTA. PR #307. |
| Edit draft `/animais/rascunhos/[id]/editar` | OK | OK | Prefilled form with same layout. PR #307. |
| Save confirmation `/animais/rascunhos/[id]/guardar` | OK | OK | Publish confirmation panel, CTA. PR #307. |
| Shelter pet list `/abrigos/[id]/animais` | OK | OK | Card grid with status badges. PR #310. |
| Publish confirm `/animais/[id]/publicar` | OK | OK | Orange CTA, summary card. PR #310. |

---

## Donations & Sponsorships ✅

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Donation form `/abrigos/[id]/doar` | OK | OK | Amount presets, payment method grid, automated + manual tier states. PR #312. |
| Sponsorship form `/abrigos/[id]/apadrinhar` | OK | OK | Interval selector (monthly/quarterly/annual), recurring CTA. PR #312. |
| Shelter donation list `/abrigos/[id]/doacoes` | OK | OK | Status badges (paid=teal, pending=amber, failed=red), retry button. PR #313. |
| Shelter sponsorship list `/abrigos/[id]/patrocinios` | OK | OK | Interval badge (active=teal). PR #313. |
| Receipt upload (manual) | OK | OK | Existing screens, logic + UI complete. |
| Donation review (shelter) | OK | OK | Existing screens, logic + UI complete. |

---

## Adoption ✅

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Adopt form `/animais/[id]/adotar` | OK | OK | Card form, GDPR checkbox, success/failed states. PR #310. |
| Candidaturas list `/abrigos/[id]/candidaturas` | OK | OK | Status badge semantics correct. PR #311. |
| Application detail `/candidaturas/[id]` | OK | OK | Applicant info card, status management panel. PR #311. |
| Donor adoptions list `/adocoes` | OK | OK | Clickable card rows, coloured status badges. PR #313. |

---

## Notifications ✅

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Notification list `/notificacoes` | OK | OK | Unread dot indicator, per-item mark-read button. PR #313. |
| Preferences `/notificacoes/preferencias` | OK | OK | CSS-only toggle (no extra deps). PR #313. |

---

## Remaining Gaps

| Screen / Component | Web | Mobile | Notes |
|---|---|---|---|
| Recover password | None | None | Logic complete (PRs #207–#208). No brand treatment applied. |
| Stripe payment UI | — | — | Stripe Checkout redirect page + success/return page. Not yet started. |

---

## Priority Order (updated 2026-06-30)

1. ✅ Foundation (PR #302)
2. ✅ Core web screens: homepage, pet feed, pet profile, auth (PR #303)
3. ✅ Shelter profile — web (PR #305)
4. ✅ Mobile screen parity — pet feed, profile, auth (PR #306)
5. ✅ Pet draft forms (PR #307)
6. ✅ Real pet images — `GET /media/:mediaId/url` Worker route (PR #308)
7. ✅ Real pet images on mobile (PR #309)
8. ✅ Adopt + publish pages (PR #310)
9. ✅ Candidaturas pages (PR #311)
10. ✅ Donation/sponsorship/registration forms (PR #312)
11. ✅ Shelter management + notification pages — 11 pages (PR #313)
12. **Recover password styling** — web `/recuperar-palavra-passe`, mobile `(auth)/recuperar-palavra-passe`
13. **Stripe Connect onboarding screen** — shelter connects their Stripe account
14. **Stripe checkout return page** — `/doacoes/sucesso` with session confirmation

---

## Brand Reference

From `docs/design-refs/stitch_dual_onboarding/pic4paws_social/DESIGN.md`:

- **Primary colour (Rescue Orange):** `#ec5b13` — adopt CTAs, active nav states, branding icons
- **Secondary colour (Teal):** `#2aa7a2` — sponsor/donate actions
- **Background:** `#f8f6f6` (page canvas), `#ffffff` (cards/headers)
- **Text:** `#0f172a` (body), `#64748b` (metadata)
- **Font:** Inter exclusively
- **Aspect ratio for pet media:** 4:5 (portrait, immersive)
- **Shape language:** `rounded-xl` (1.5rem) for buttons/overlays, full-circle avatars
- **Bottom nav:** blurred backdrop (`backdrop-blur-md`), icon fill on active state
