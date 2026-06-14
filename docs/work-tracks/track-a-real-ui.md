# Work Track: Track A — Real UI

## Goal

Wire the existing boundary state machines into real Next.js App Router pages (web) and Expo Router screens (mobile). No new domain logic — the boundaries and clients are complete. This track adds the React/React Native rendering layer.

## Guiding Rules

- Pages are thin rendering shells. All domain logic stays in the boundaries.
- Use `'use client'` Client Components for boundary-driven state machines; avoid duplicating logic in server components.
- Worker URL comes from `NEXT_PUBLIC_WORKER_URL` (web) and equivalent mobile env var.
- Auth token comes from Supabase session via a shared hook — never from localStorage or URL params.
- No hardcoded secrets. No client-side service-role key.
- Keep domain behavior testable outside UI: do not move logic into page components.

## Phase 1: Web Public Pages (no auth)

| Work Item | Route | Boundary |
|---|---|---|
| `WEB-PET-FEED-PAGE-001` | `/animais` | `createWebPetFeedUi` |
| `WEB-PET-PROFILE-PAGE-001` | `/animais/[petId]` | `createWebPetProfileUi` |
| `WEB-SHELTER-SEARCH-PAGE-001` | `/abrigos` | `createWebShelterSearchUi` |
| `WEB-SHELTER-PROFILE-PAGE-001` | `/abrigos/[shelterId]` | `createWebShelterProfileUi` |

## Phase 2: Web Auth

| Work Item | Route | Boundary |
|---|---|---|
| `WEB-AUTH-PAGE-001` | `/entrar` | Supabase client + session hook |

## Phase 3: Web Auth-Gated Pages (adopter)

| Work Item | Route | Boundary |
|---|---|---|
| `WEB-ADOPTION-PAGE-001` | `/animais/[petId]/adotar` | `createWebAdoptionUi` |
| `WEB-DONATION-PAGE-001` | `/abrigos/[shelterId]/doar` | `createWebDonationUi` |
| `WEB-DONATION-STATUS-PAGE-001` | `/doacoes/[donationId]` | `createWebDonationStatusUi` |

## Phase 4: Web Auth-Gated Pages (shelter)

| Work Item | Route | Boundary |
|---|---|---|
| `WEB-SHELTER-REGISTER-PAGE-001` | `/abrigos/registar` | `createWebShelterRegistrationUi` |
| `WEB-SHELTER-UPDATE-PAGE-001` | `/abrigos/[shelterId]/editar` | `createWebShelterUpdateUi` |

## Phase 5: Mobile Screens

Mirror of Phases 1–4 using Expo Router. Work item IDs follow `MOBILE-*-SCREEN-001` pattern.

## Implementation Pattern (Web)

Each page follows the same structure:

1. `apps/web/src/<domain>.ts` — boundary already exists (no changes needed)
2. `apps/web/app/<route>/page.tsx` — `'use client'` component:
   - Reads worker URL from `process.env.NEXT_PUBLIC_WORKER_URL`
   - Creates client via `@pic4paws/client` factory
   - Creates UI via boundary factory
   - `useState` on `getInitialState()`, `useEffect` triggers `load*`
   - Renders each state branch

## Current Focus

`WEB-PET-FEED-PAGE-001` — first real page, establishes the env + client + boundary pattern for all subsequent pages.
