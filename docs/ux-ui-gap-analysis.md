# UX/UI Gap Analysis — Pic4Paws

> Compared against `docs/design-refs/stitch_dual_onboarding` · Last updated 2026-06-29

**Status legend:** None = no styling applied · Partial = some structure but doesn't match design ref · OK = matches design ref

---

## Foundation ✅

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Design tokens (`packages/ui`) | OK | OK | Full `brandTokens` — colours, typography scale + weights, radii (numeric), spacing, RN shadow presets. Single source of truth for both platforms. (PR #302) |
| Tailwind v4 on web | OK | — | `@import "tailwindcss"` + `@theme {}` with all brand variables in `apps/web/app/styles.css`. PostCSS via `@tailwindcss/postcss`. (PR #302) |
| Web global nav | OK | — | `SiteNav` sticky header: logo, main nav links with active-state highlight, Entrar/Registar auth CTAs. Mounted in `RootLayout`. (PR #302) |
| Mobile bottom tab bar | OK | OK | Branded tabs: orange active tint (`#ec5b13`), slate inactive, white surface. Material Icons: pets / favorite / volunteer-activism / apartment / notifications. (PR #302) |

---

## Onboarding

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Homepage `/` (`hero_page` ref) | OK | — | Two role-selection cards (Adopter → orange, Shelter → teal), eyebrow, h1, subtitle, Termos/Privacidade footer strip. (PR #303) |
| Login `/entrar` | OK | None | Branded card form — email/password fields with focus-ring, forgot-password link, orange CTA, error alert, sign-up crosslink. (PR #303) · **Mobile:** raw unstyled form. |
| Registration `/registar` | OK | None | Branded card form — email/name/password/GDPR checkbox, success/failed states styled, crosslinks. (PR #303) · **Mobile:** raw unstyled form. |
| Recover password | None | None | Raw form, no design treatment (both platforms). |

---

## Pet Feed

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Feed list `/animais` (`paw_feed_home` ref) | OK | None | **Web (PR #303):** Responsive 1→2→3 column card grid. Each card: 4:5 aspect-ratio placeholder with species emoji + gradient, Disponível badge, species · location meta, clamp-2 description, Adoptar (orange) + Apadrinha (teal) CTA buttons. Empty/failed/loading states styled. · **Mobile:** still text-only list, no card layout. **Both:** placeholder replaces real photo — images appear when media URL resolution is wired on the worker. |
| Pet profile `/animais/[petId]` (`pet_profile` ref) | OK | None | **Web (PR #303):** 4:5 hero placeholder, Disponível overlay, back link, name/species/location, shelter link, description, medical badge row (Vacinado / Esterilizado / Microchipado — green ✓ teal when true, grey ✗ when false), Necessidades especiais badge, publicNotes, sponsorship teaser section (`#apadrinha` anchor), sticky bottom CTA bar (🤲 Apadrinha teal + 🐾 Adoptar orange). · **Mobile:** raw text layout. **Both:** hero shows placeholder until media URL resolution is added. |

---

## Shelter / Dashboard

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Shelter profile `/abrigos/[id]` | None | None | No design treatment — route and view-model logic exist. Design ref (`shelter_association_dashboard`): Performance Overview card (donations + sponsors), "Have a new resident?" orange CTA banner, Active Residents 2-column grid with species filter tabs, SPONSORED / NEEDS SPONSOR badges, FAB (+). |
| Register shelter `/abrigos/registar` | None | None | Multi-step form exists (logic wired) — no brand styling applied. |

---

## Pet Upload / Draft

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| New pet form `/animais/rascunhos/novo` (`upload_new_pet_form` ref) | None | None | Photo upload drop-zone with dashed orange border + camera icon. Traits & Tags chip pills. Health & Medical toggles. Monthly Sponsorship Goal field. Medical Documents secondary upload zone. "Publish to Feed" sticky orange CTA + "Save Draft" ghost link. |
| Upload success confirmation | None | None | Celebration illustration, pet preview card, "View Listing" + "Back to Dashboard" buttons — currently no success screen. |

---

## Donations & Sponsorships

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Donation / sponsorship flows | None | None | All pages exist (logic fully wired) but no design applied — forms, receipts, review screens are plain HTML/RN text. |

---

## Adoption

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Adoption form & list | None | None | Routes and view-model logic exist, zero visual styling. |

---

## Notifications

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Notification list & preferences | None | None | Pages exist (logic wired), no styling. |

---

## Priority Order (updated 2026-06-29)

1. ✅ **Foundation** — Tailwind v4 on web, expanded brand tokens, global nav, mobile tab bar.
2. ✅ **High-priority web screens** — homepage role cards, pet feed card grid, pet profile with medical badges, auth forms.
3. **Next: shelter dashboard** — design ref exists (`shelter_association_dashboard`); performance overview card, residents grid, add-pet CTA banner.
4. **Mobile screen parity** — apply card layouts and brand styling to mobile pet feed, pet profile, auth screens.
5. **Systematic pass** — pet upload form, upload success, donations/adoption/sponsorship/notification pages.
6. **Real pet images** — wire media URL resolution on the worker so `heroMediaId` becomes a signed R2 URL; replace placeholders in card and profile views.

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
