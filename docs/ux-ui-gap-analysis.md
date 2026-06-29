# UX/UI Gap Analysis — Pic4Paws

> Compared against `docs/design-refs/stitch_dual_onboarding` · June 2026

**Status legend:** None = no styling applied · Partial = some structure but doesn't match design ref · OK = matches design ref

---

## Foundation

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Design tokens & shared components (`packages/ui`) | None | None | Only `brandTokens` exported — no `Button`, `Card`, `Badge`, `Avatar`, `Input`, `ProgressBar`, `NavBar` components. No Tailwind config or CSS design system wired to web. No React Native component library for mobile. |
| Global navigation (persistent header / bottom bar) | None | Partial | **Web:** no nav at all — no header, no bottom bar, no tab strip. **Mobile:** expo-router tab bar exists but unstyled — missing paw/explore/history/profile icons and active-state orange fill. |

---

## Onboarding

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Homepage `/` (`hero_page` ref) | Partial | — | Has text + CTA buttons but wrong layout — design shows two role-selection **cards** (Adopter / Shelter) with illustrations. Missing paw logo and "Already have an account? Sign In" footer link. Button colour is teal instead of orange primary per spec. |
| Login `/entrar` | None | None | Raw unstyled form — needs brand card, orange submit button, Inter styling, error state styles, link to registration. |
| Registration `/registar` | None | None | Same as login — raw form, no brand styling. |
| Recover password | None | None | Raw form, no design treatment. |

---

## Pet Feed

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Feed list `/animais` (`paw_feed_home` ref) | None | None | **Web:** plain `<ul>` list with text only. **Mobile:** text-only cards, no images. **Both:** missing full-bleed 4:5 pet photo, shelter avatar + name header per card, "Adopt Me" (orange) and "Sponsor / Donate" (teal) overlay buttons, like/comment/share interaction bar, "Available for Adoption" rescue tag. |
| Pet profile `/animais/[petId]` (`pet_profile` ref) | None | None | Hero full-screen image with status overlay ("Available for Adoption"). Breed + age subtitle. Shelter name with location pin. "About Me" narrative section. Sponsorship Goal progress bar (% funded). Vaccinated / Sterilized / Energy Level badge row. Sticky bottom bar: Sponsor (teal) + Adopt Me (orange). |

---

## Shelter / Dashboard

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Shelter dashboard `/abrigos/[id]` (`shelter_association_dashboard` ref) | None | None | Performance Overview card (total donations + active sponsors with % change). "Have a new resident?" orange CTA banner. Active Residents grid — filter tabs (All / Dogs / Cats …) + 2-column card grid. SPONSORED / NEEDS SPONSOR status badges on resident cards. FAB (+) for quick add. |
| Register shelter `/abrigos/registar` | None | None | Multi-step form with brand styling — no design treatment applied. |

---

## Pet Upload / Draft

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| New pet form `/animais/rascunhos/novo` (`upload_new_pet_form` ref) | None | None | Photo upload drop-zone with dashed orange border + camera icon. Traits & Tags section with removable chip pills. Health & Medical toggles (Vaccinated / Sterilized). Monthly Sponsorship Goal field. Medical Documents secondary upload zone. "Publish to Feed" sticky orange CTA + "Save Draft" ghost link. |
| Upload success confirmation (`upload_success_confirmation` ref) | None | None | Celebration illustration, pet preview card, "View Listing" + "Back to Dashboard" buttons — currently no success screen exists. |

---

## Donations & Sponsorships

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Donation / sponsorship flows | None | None | All pages exist (logic wired) but no design applied — forms, receipts, review screens are plain HTML/RN text. |

---

## Adoption

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Adoption form & list | None | None | Routes and view-model logic exist, zero visual styling. |

---

## Notifications

| Screen / Component | Web | Mobile | What's missing |
|---|---|---|---|
| Notification list & preferences | None | None | Pages exist, no styling. |

---

## Priority Order

1. **Foundation first** — `packages/ui` shared components + web CSS system + mobile component base. Everything else depends on this.
2. **High-priority screens** (design refs exist): homepage role-selection cards → pet feed social cards → pet profile with hero image/badges/CTAs → shelter dashboard with metrics and resident grid.
3. **Systematic pass** on all remaining screens: login/register/recover forms → pet upload form → upload success screen → donations/adoption/sponsorship/notification pages.

---

## Brand Reference

From `docs/design-refs/stitch_dual_onboarding/pic4paws_social/DESIGN.md`:

- **Primary colour (Rescue Orange):** `#ec5b13` — adopt CTAs, active nav states, branding icons
- **Secondary colour (Teal):** `#2dd4bf` / `#2aa7a2` — sponsor/donate actions
- **Background:** `#f8f6f6` (page canvas), `#ffffff` (cards/headers)
- **Text:** `#0f172a` (body), `#64748b` (metadata)
- **Font:** Inter exclusively
- **Aspect ratio for pet media:** 4:5 (portrait, immersive)
- **Shape language:** `rounded-xl` (1.5rem) for buttons/overlays, full-circle avatars
- **Bottom nav:** blurred backdrop (`backdrop-blur-md`), icon fill on active state
