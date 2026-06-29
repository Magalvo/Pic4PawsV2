# Checkpoint — 2026-06-29: UI Foundation + Core Screens Complete

## Status

**HEAD (main)**: `af30eae` (PR #303 merged — feat: homepage role cards, pet feed grid, pet profile, auth forms)
**Tests**: 2550 passing (280 test files)
**Gates**: typecheck ✅ lint ✅ test ✅ build ✅

## What Was Completed Since Last Checkpoint

Previous checkpoint: `2026-06-29-eupago-remediation-complete.md` (PR #294, 2546 tests)

### Local Dev Stack Wiring (PRs #300–#301)

- `LOCAL-DEV-WIRING-001` (PR #300) — fixed Worker dispatcher: `resolveWorkerRequestDependencies` was never called inside `_dispatchWorkerRequest`, leaving all Supabase repos undefined; CORS preflight added; `WorkerSupabaseWiringError` caught and returned as `dependency_configuration_error`; `wrangler.toml` added; `.dev.vars.example` documents required secrets (`.dev.vars` is gitignored); `/` added as public route in web middleware.
- `SERVICE-ROLE-GRANTS-001` (PR #301) — local Supabase CLI does not auto-grant `service_role` table privileges (unlike hosted Supabase); migration `0011_service_role_grants` adds `GRANT ALL ON ALL TABLES` + `ALTER DEFAULT PRIVILEGES` for `service_role`; `migration-artifacts.ts` + test updated.

### UI Foundation (PR #302)

- **Tailwind v4** installed on web (`tailwindcss@4.3.2` + `@tailwindcss/postcss`); `postcss.config.mjs` added; CSS `@theme {}` block in `styles.css` defines all brand variables (`--color-primary`, `--color-teal`, `--color-bg`, `--color-surface`, `--color-ink`, `--color-muted`, `--color-border`, font, radii) — every future page can use utility classes like `bg-primary`, `text-teal`, `border-border`.
- **`packages/ui` expanded** — `brandTokens` now exports full design token set: typography scale + weights + line-heights, spacing, radii as numbers, and React Native shadow presets. Single source of truth for both platforms.
- **Web `SiteNav`** — sticky header with Pic4Paws logo, main nav links (Animais / Abrigos / Adoções / Donativos) with active-state highlight, and Entrar/Registar auth CTAs. Mounted in `RootLayout`.
- **Mobile tab bar** — `(tabs)/_layout.tsx` now applies brand colours: orange active tint (`#ec5b13`), slate inactive (`#94a3b8`), white surface, 60px height, Material Icons (pets / favorite / volunteer-activism / apartment / notifications).

### Core Web Screens (PR #303)

- **Homepage `/`** — replaced generic hero+features with two role-selection cards: Adopter card (orange CTA → `/animais`) and Shelter card (teal CTA → `/abrigos/registar`). Eyebrow, h1, subtitle, footer Termos/Privacidade strip. Old readiness/features/CSS classes removed.
- **Pet feed `/animais`** — responsive 1→2→3 column card grid. Each card: 4:5 aspect-ratio placeholder (species emoji + brand gradient), Disponível badge, species · location meta, clamp-2 description, Adoptar (orange) + Apadrinha (teal) CTA buttons. Loading/empty/failed states all styled.
- **Pet profile `/animais/[petId]`** — 4:5 hero placeholder with Disponível overlay, back link, name/species/location, shelter link, description, medical badge row (Vacinado / Esterilizado / Microchipado — green teal ✓ / grey ✗), Necessidades especiais amber badge, publicNotes, sponsorship teaser section, sticky bottom CTA bar (🤲 Apadrinha teal + 🐾 Adoptar orange).
- **Login `/entrar`** — branded card: email/password fields with focus-ring, forgot-password link, orange submit CTA, error alert, sign-up crosslink. Logic unchanged.
- **Registration `/registar`** — branded card: email/name/password/GDPR checkbox, success and failed states all styled (with email-already-registered recovery links). Logic unchanged.

## Architecture Decisions Made

- **Placeholder images** — `PetFeedPet.heroMediaId` exists but is not a signed URL; placeholder gradient + species emoji used until a worker-side media URL resolution route is added. Card and profile layouts are designed for a direct `<img>` drop-in.
- **Tailwind v4 CSS-first config** — no `tailwind.config.ts`; all brand values live in `@theme {}` inside `styles.css`. This mirrors `brandTokens` in `packages/ui` for cross-platform consistency.
- **`SiteNav` mounted globally** — rendered in `RootLayout` so it appears on all pages including homepage; homepage body begins immediately below the 56px sticky header.
- **Local Supabase CLI** — does NOT auto-grant `service_role` table privileges; requires explicit `GRANT ALL ON ALL TABLES` migration. This is different from hosted Supabase.

## What Is Next

### UI Track (in priority order)

1. **Shelter dashboard `/abrigos/[id]`** — design ref (`shelter_association_dashboard`): Performance Overview card (total donations + active sponsors with % change), "Have a new resident?" orange CTA banner, Active Residents 2-column grid with species filter tabs, SPONSORED / NEEDS SPONSOR badges on resident cards, FAB (+) for quick add.
2. **Mobile screen parity** — card layouts and brand styling for mobile pet feed, pet profile, auth screens (login + register).
3. **Pet upload form** — drop-zone with dashed orange border, trait chip pills, medical toggles, sponsorship goal field, sticky publish CTA. Design ref: `upload_new_pet_form`.
4. **Real pet images** — add `GET /media/:mediaId/url` Worker route returning a signed R2 URL; replace placeholder in card + profile views with `<img>`.

### Infrastructure

- **P3 advisory (DonationRepository interface)** — remove `?:` from `setProviderPaymentId` and `failDonation` in `apps/workers/src/donation.ts:75-76`. Low risk.
- **Production deployment** — `PAYMENT_ENCRYPTION_SECRET` must be provisioned in Cloudflare Workers env before going live.
- **Mobile app store** — EAS build config, icons, splash screens, bundle identifiers not yet set up.
