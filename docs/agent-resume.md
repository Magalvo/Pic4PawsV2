# Agent Resume Guide

Use this guide when continuing Pic4Paws V2 from another computer or another AI agent session.

## 1. Fresh Machine Setup

1. Clone or pull the repository.
2. Ensure Node/npm versions are compatible with `package.json`:
   - package manager: `npm@10.9.2`
   - TypeScript monorepo with npm workspaces and Turborepo
3. Install dependencies:
   - `npm ci`
4. Create local environment file:
   - copy `.env.example` to `.env`
   - replace placeholders with local/dev-only credentials
   - do not commit `.env`

## 2. Context Files To Read First

Read these files before implementing new work:

- `AGENTS.md`
- `docs/Project_Constitution.md`
- `docs/canonical/architecture-proposal.md`
- `docs/canonical/sdd.md`
- `docs/work-tracks/remake-foundation.md`
- latest file in `docs/checkpoints/`

The legacy app under `reference/` is functional reference only. Do not copy its architecture, tech stack, UI stack or design patterns into V2.

## 3. Required Working Method

Do not work directly on `main`.

### Default: one branch per work item

For each new work item:

1. `git switch main`
2. `git pull --ff-only origin main`
3. `git switch -c agent/<WORK-ITEM-ID>`
4. create or update the work item in `docs/work-items/`
5. create or update the work spec in `docs/work-specs/`
6. write the failing test first
7. implement the smallest change that passes
8. run validation
9. commit one coherent checkpoint
10. push branch and open PR

### Exception: batch branch

Use `agent/<FEATURE>-batch` only when all items are **entirely new** (none has production value without the others) and are **tightly coupled by type contract** (e.g. a brand-new Worker route + its client + both boundaries introduced for the first time together). Each work item must still be a separate commit within the batch. This is an exception, not the default.

Do not batch items that can be reviewed or merged independently.

### Required validation before every commit

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 4. Current State As Of 2026-06-08

All foundation work, the full public read path, the full shelter-side adoption review
slice, and the first item of the donation slice merged into `main`.

Completed foundation items (all merged to `main`):

- `AUTH-SUPABASE-001`
- `SEC-001`
- `WORKER-SUPABASE-WIRING-001`
- `WORKER-SUPABASE-SDK-001`
- `R2-SIGNER-SDK-001`
- `MEDIA-WORKER-PERSIST-001`
- `MEDIA-UPLOAD-CLIENT-001`
- `MEDIA-UPLOAD-BINARY-CLIENT-001`
- `MEDIA-UPLOAD-FLOW-CLIENT-001`
- `WEB-MEDIA-UPLOAD-001`
- `MOBILE-MEDIA-UPLOAD-001`
- `PET-MEDIA-UPLOAD-UI-001`
- `PET-MEDIA-ATTACH-WORKER-001`
- `PET-MEDIA-ATTACH-CLIENT-001`
- `PET-MEDIA-UPLOAD-ATTACH-FLOW-001`
- `WEB-PET-MEDIA-UPLOAD-ATTACH-001`
- `MOBILE-PET-MEDIA-UPLOAD-ATTACH-001`
- `PET-PUBLISH-CLIENT-001`
- `WEB-PET-PUBLISH-001`
- `MOBILE-PET-PUBLISH-001`
- `PET-DRAFT-CLIENT-001`
- `WEB-PET-DRAFT-001`
- `MOBILE-PET-DRAFT-001`
- `PET-DRAFT-SAVE-FLOW-CLIENT-001`
- `WEB-PET-DRAFT-SAVE-FLOW-001`
- `MOBILE-PET-DRAFT-SAVE-FLOW-001`
- `PET-FEED-WORKER-001` — public `GET /pets` Worker route with pagination
- `PET-FEED-CLIENT-001` — `createPetFeedClient` in `@pic4paws/client`
- `WEB-PET-FEED-001` — Web pet feed product boundary with PT-PT states
- `MOBILE-PET-FEED-001` — Mobile pet feed product boundary with PT-PT states
- `PET-PROFILE-WORKER-001` — public `GET /pets/:petId` single-pet Worker route
- `PET-PROFILE-CLIENT-001` — `createPetProfileClient` in `@pic4paws/client`
- `WEB-PET-PROFILE-001` — Web pet profile product boundary with PT-PT states
- `MOBILE-PET-PROFILE-001` — Mobile pet profile product boundary with PT-PT states
- `SHELTER-PROFILE-WORKER-001` — public `GET /shelters/:shelterId` Worker route
- `SHELTER-PROFILE-CLIENT-001` — `createShelterProfileClient` in `@pic4paws/client`
- `WEB-SHELTER-PROFILE-001` — Web shelter profile product boundary with PT-PT states
- `MOBILE-SHELTER-PROFILE-001` — Mobile shelter profile product boundary with PT-PT states
- `ADOPTION-WORKER-001` — authenticated `POST /adoptions` Worker route
- `ADOPTION-CLIENT-001` — `createAdoptionApplicationClient` in `@pic4paws/client`
- `WEB-ADOPTION-001` — Web adoption application product boundary with PT-PT states
- `MOBILE-ADOPTION-001` — Mobile adoption application product boundary with PT-PT states
- `ADOPTION-LIST-WORKER-001` — authenticated `GET /shelters/:shelterId/adoptions` Worker route
- `ADOPTION-LIST-CLIENT-001` — `createAdoptionListClient` in `@pic4paws/client`
- `WEB-ADOPTION-LIST-001` — Web adoption list product boundary with PT-PT states
- `MOBILE-ADOPTION-LIST-001` — Mobile adoption list product boundary with PT-PT states
- `DONATION-WORKER-001` — authenticated `POST /donations` Worker route (donation intent initiation)
- `DONATION-CLIENT-001` — `createDonationClient` in `@pic4paws/client`
- `WEB-DONATION-001` — Web donation product boundary with PT-PT states
- `MOBILE-DONATION-001` — Mobile donation product boundary with PT-PT states
- `DONATION-LIST-WORKER-001` — authenticated `GET /shelters/:shelterId/donations` Worker route
- `DONATION-LIST-CLIENT-001` — `createDonationListClient` in `@pic4paws/client`
- `WEB-DONATION-LIST-001` — Web donation list product boundary with PT-PT states (6 states incl. forbidden)
- `MOBILE-DONATION-LIST-001` — Mobile donation list product boundary with PT-PT states
- `PAYMENT-WEBHOOK-WORKER-001` — `POST /webhooks/payments` payment webhook handler (server-to-server)
- `DONATION-STATUS-WORKER-001` — `GET /donations/:donationId` donor status polling Worker route
- `DONATION-STATUS-CLIENT-001` — `createDonationStatusClient` in `@pic4paws/client`
- `WEB-DONATION-STATUS-001` — Web donation status product boundary (6 states incl. not_found + forbidden)
- `MOBILE-DONATION-STATUS-001` — Mobile donation status product boundary with PT-PT states
- `SPONSORSHIP-WORKER-001` — authenticated `POST /sponsorships` Worker route with `SponsorshipRepository` + Supabase impl
- `SPONSORSHIP-CLIENT-001` — `createSponsorshipClient` in `@pic4paws/client`
- `WEB-SPONSORSHIP-001` — Web sponsorship product boundary (4 states: idle/submitting/submitted/failed)
- `MOBILE-SPONSORSHIP-001` — Mobile sponsorship product boundary with PT-PT states

The Worker now has (as of 2026-06-08):

- server-side Supabase SDK dependency composition
- server-side R2/S3-compatible upload signer factory
- authenticated media upload persistence for signed intents
- authenticated pet media attachment for persisted public image assets
- authenticated pet draft create, update, and publish routes
- public paginated pet feed (`GET /pets`) with `PetFeedRepository` interface
- public single-pet profile (`GET /pets/:petId`) with `PetProfileRepository` interface
- public shelter profile (`GET /shelters/:shelterId`) with `ShelterProfileRepository` interface
- authenticated adoption application (`POST /adoptions`) with `AdoptionApplicationRepository`
  interface — `shelterId` derived server-side, GDPR consent gate, status `submitted`
- authenticated adoption list (`GET /shelters/:shelterId/adoptions`) with
  `AdoptionListRepository` interface — paginated (limit/offset), shelter membership check,
  `matchWorkerAdoptionListShelterId` for URL path matching
- authenticated donation intent (`POST /donations`) with `DonationRepository` interface —
  `amountCents ≥ 100`, GDPR gate, `donorUserId` from authenticated actor, provider from
  config, stub `providerPaymentId` + `idempotencyKey` via `crypto.randomUUID()`
- authenticated shelter donation list (`GET /shelters/:shelterId/donations`) with
  `DonationListRepository` interface — paginated (limit/offset), shelter membership check,
  `matchWorkerDonationListShelterId` for URL path matching
- `POST /webhooks/payments` payment webhook handler — `PaymentWebhookVerifier` interface
  (HMAC verification, provider-specific), `PaymentWebhookRepository` (idempotency via
  `payment_webhook_events`, UPDATE `donation_transactions`), `PROVIDER_SIGNATURE_HEADERS` map.
  `paymentWebhookVerifier` intentionally NOT set by factory (requires provider SDK adapter)
- `GET /donations/:donationId` donor status polling — `DonationStatusRepository.getDonationStatus`,
  donor-only access (`actor.id !== record.donorUserId → 403`), `donorUserId` omitted from 200
  response, `matchWorkerDonationStatusId` path matcher
- `SupabaseTableQueryLike` supports `.is()`, `.order()`, `.range()`
- `WORKER_SHELTER_PATH` config (default `/shelters`)
- `WORKER_ADOPTIONS_PATH` config (default `/adoptions`)
- `WORKER_DONATIONS_PATH` config (default `/donations`)
- private shelter fields (taxId, registrationNumber, precise address, paymentAccountStatus)
  deliberately excluded from the public shelter profile response
- tests that keep Supabase and Cloudflare calls mocked/injected

`@pic4paws/client` now has:

- `MediaUploadClient`, `MediaUploadBinaryClient`, `MediaUploadFlowClient`
- `PetMediaAttachClient`, `PetMediaUploadAttachFlowClient`
- `PetPublishClient`
- `PetDraftClient`
- `PetDraftSaveFlowClient` (composed draft save + media upload flow)
- `PetFeedClient` (public read, no auth)
- `PetProfileClient` (public read, no auth)
- `ShelterProfileClient` (public read, no auth)
- `AdoptionApplicationClient` (authenticated write — `submitApplication`)
- `AdoptionListClient` (authenticated read — `loadApplications` with pagination)
- `DonationClient` (authenticated write — `submitDonation`)
- `DonationListClient` (authenticated read — `loadDonations` with pagination)
- `DonationStatusClient` (authenticated read — `loadDonationStatus(donationId)`)
- `SponsorshipClient` (authenticated write — `submitSponsorship` with `recurringInterval`)
- no client-side Supabase service-role keys or R2 credentials

Web/Mobile now have tested product boundaries for: media upload, pet media upload+attach,
pet publish, pet draft, pet draft save flow, pet feed, pet profile, shelter profile,
adoption application, adoption list (shelter-side review), donation, donation list
(shelter-side, 6 states including dedicated `forbidden`), donation status (6 states
including dedicated `not_found` + `forbidden`), sponsorship (recurring / padrinhos,
4 states including idle/submitting/submitted/failed).

The adopter end-to-end flow is fully wired at the boundary layer:
**feed → pet profile → shelter profile → submit adoption application**.

The shelter-side adoption review flow is fully wired at the boundary layer:
**Worker route → client → Web + Mobile product boundaries**.

The full donation slice is wired end-to-end:
**donation intent → payment webhook → donor status polling → Web + Mobile boundaries**.

The full sponsorship slice (padrinhos) is wired end-to-end:
**sponsorship intent → Web + Mobile boundaries** (`POST /sponsorships` Worker route + `SponsorshipClient` + both product boundaries).

Payment state is always driven by verified server-side webhook. The `paymentWebhookVerifier`
is intentionally left unset by the factory — provider-specific HMAC adapters must be wired
per deployment.

## 5. Recommended Next Work Item

**SPONSORSHIP-LIST-WORKER-001** — Shelter-side sponsorship list Worker route.

Design sketch (mirrors `DONATION-LIST-WORKER-001`):

- `GET /shelters/:shelterId/sponsorships` — authenticated, shelter-membership check
- Pagination: `limit` / `offset` query params, default `limit=20`, max `limit=100`
- `SponsorshipListRepository` interface: `listSponsorships({ shelterId, limit, offset })`
- Supabase impl in `sponsorship-supabase.ts` (extend `createSupabaseSponsorshipRepositories`)
- `matchWorkerSponsorshipListShelterId` path matcher
- Returns `{ status: 'sponsorships_listed', sponsorships: [...], total, limit, offset }`
- Route wired under `WORKER_SPONSORSHIPS_PATH` prefix (i.e. `{sponsorshipsPath}/{shelterId}/sponsorships`)

After SPONSORSHIP-LIST-WORKER-001:
- `SPONSORSHIP-LIST-CLIENT-001` — `createSponsorshipListClient` in `@pic4paws/client`
- `WEB-SPONSORSHIP-LIST-001` / `MOBILE-SPONSORSHIP-LIST-001` — shelter-side list product boundaries

## 6. Handoff Prompt For Codex

Use this prompt in a new Codex thread:

```text
Read AGENTS.md, docs/codex-resume.md, docs/work-tracks/remake-foundation.md and the latest docs/checkpoints file. Continue Pic4Paws V2 from main using strict SDD/TDD. Do not work on main. Start the next recommended work item unless I specify another one.
```
