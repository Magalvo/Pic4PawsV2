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

## 4. Current State As Of 2026-06-09

**Repository status**: 1044 tests passing (123 test files), full foundation complete through notifications slice.

**Main branch HEAD** (commit `729c39b`): PR #93 (MOBILE-PET-ARCHIVE-001) merged

**In-flight branch** `agent/notifications-batch` (4 commits, pending PR):
- `8d1c2ed` — NOTIFICATION-WORKER-001 (21 tests)
- `5c175d1` — NOTIFICATION-CLIENT-001 (10 tests)
- `31c656c` — WEB-NOTIFICATION-001 (9 tests)
- `7e0f1bd` — MOBILE-NOTIFICATION-001 (9 tests)

All 4 commits pass full validation:
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅
- `npm run build` ✅

**Latest checkpoint**: [2026-06-09-pet-archive-adoption-view-shelter-member-complete.md](docs/checkpoints/2026-06-09-pet-archive-adoption-view-shelter-member-complete.md)

### Merged Work Items (up to 2026-06-09)

**All of these are merged to `main` and passing validation**:

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
- `SPONSORSHIP-LIST-WORKER-001` — authenticated `GET /shelters/:shelterId/sponsorships` Worker route with `SponsorshipListRepository` + Supabase impl
- `SPONSORSHIP-LIST-CLIENT-001` — `createSponsorshipListClient` in `@pic4paws/client`
- `WEB-SPONSORSHIP-LIST-001` — Web sponsorship list product boundary (6 states incl. dedicated `forbidden`)
- `MOBILE-SPONSORSHIP-LIST-001` — Mobile sponsorship list product boundary with PT-PT states
- `SPONSORSHIP-MANAGE-WORKER-001` — authenticated `PATCH /sponsorships/:sponsorshipId` route with dual access (shelter manager OR donor), `SponsorshipManageRepository` + Supabase impl
- `SPONSORSHIP-MANAGE-CLIENT-001` — `createSponsorshipManageClient` in `@pic4paws/client`
- `WEB-SPONSORSHIP-MANAGE-001` — Web sponsorship manage product boundary (4 states: idle/submitting/succeeded/failed)
- `MOBILE-SPONSORSHIP-MANAGE-001` — Mobile sponsorship manage product boundary with PT-PT states
- `SPONSORSHIP-DONOR-LIST-WORKER-001` — authenticated `GET /sponsorships` donor-only route, `SponsorshipDonorListRepository` + Supabase impl, method-switched before POST block
- `SPONSORSHIP-DONOR-LIST-CLIENT-001` — `createSponsorshipDonorListClient` in `@pic4paws/client`
- `WEB-SPONSORSHIP-DONOR-LIST-001` — Web donor sponsorship list product boundary (5 states, no `forbidden`)
- `MOBILE-SPONSORSHIP-DONOR-LIST-001` — Mobile donor sponsorship list product boundary with PT-PT states
- `ADOPTION-STATUS-WORKER-001` — authenticated `PATCH /adoptions/:applicationId` shelter-only status management route, `AdoptionStatusRepository` + Supabase impl, shelter-settable statuses: `under_review | more_info_requested | approved | rejected`
- `ADOPTION-STATUS-CLIENT-001` — `createAdoptionStatusClient` in `@pic4paws/client`
- `WEB-ADOPTION-STATUS-001` — Web adoption status product boundary for shelter staff (4 states: idle/submitting/succeeded/failed)
- `MOBILE-ADOPTION-STATUS-001` — Mobile adoption status product boundary for shelter staff
- `ADOPTION-VIEW-WORKER-001` — `GET /adoptions/:applicationId` dual-access Worker route (applicant OR shelter member), `AdoptionViewRepository` + Supabase impl, `applicantUserId` omitted from response
- `ADOPTION-VIEW-CLIENT-001` — `createAdoptionViewClient` in `@pic4paws/client`
- `WEB-ADOPTION-VIEW-001` — Web adoption view product boundary (6 states: idle/loading/loaded/not_found/forbidden/failed)
- `MOBILE-ADOPTION-VIEW-001` — Mobile adoption view product boundary with PT-PT states
- `SHELTER-MEMBER-WORKER-001` — `GET/POST /shelters/:shelterId/members` + `DELETE /shelters/:shelterId/members/:memberId` Worker routes, `ShelterMemberRepository` + Supabase impl, soft-delete pattern, route ordering enforced
- `SHELTER-MEMBER-CLIENT-001` — `createShelterMemberClient` in `@pic4paws/client` (loadShelterMembers / addShelterMember / removeShelterMember)
- `WEB-SHELTER-MEMBER-001` — Web shelter member product boundary (8 states: idle/loading/loaded/forbidden/failed + member_added/member_removed/action_failed — first combined read+write boundary)
- `MOBILE-SHELTER-MEMBER-001` — Mobile shelter member product boundary with PT-PT states (8 states)
- `NOTIFICATION-WORKER-001` — migration `0002_notifications`, `NotificationRepository` + Supabase impl, fire-and-forget dispatch into 4 handlers, `GET /notifications` + `PATCH /notifications/:id/read` routes *(in `agent/notifications-batch`, pending merge)*
- `NOTIFICATION-CLIENT-001` — `createNotificationClient` in `@pic4paws/client` (`listNotifications` + `markNotificationRead`) *(in `agent/notifications-batch`, pending merge)*
- `WEB-NOTIFICATION-001` — Web notification product boundary (4 states: idle/loading/loaded/failed, optimistic markRead) *(in `agent/notifications-batch`, pending merge)*
- `MOBILE-NOTIFICATION-001` — Mobile notification product boundary with PT-PT states *(in `agent/notifications-batch`, pending merge)*

The Worker now has (as of 2026-06-09, updated through `agent/notifications-batch`):

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
- authenticated shelter sponsorship list (`GET /shelters/:shelterId/sponsorships`) with
  `SponsorshipListRepository` interface — paginated (limit/offset), shelter membership check,
  `matchWorkerSponsorshipListShelterId` for URL path matching
- authenticated sponsorship manage (`PATCH /sponsorships/:sponsorshipId`) with
  `SponsorshipManageRepository` interface — dual access (shelter manager OR donor),
  `matchWorkerSponsorshipManageId` path matcher, `getSponsorshipForManage` + `updateSponsorshipStatus`
- donor-facing sponsorship list (`GET /sponsorships`) with `SponsorshipDonorListRepository`
  interface — actor's own sponsorships, no shelter membership check, method-switched before POST
- adoption status management (`PATCH /adoptions/:applicationId`) with `AdoptionStatusRepository`
  interface — shelter membership only, `matchWorkerAdoptionStatusId` path matcher,
  shelter-settable statuses: `under_review | more_info_requested | approved | rejected`
- adoption view (`GET /adoptions/:applicationId`) with `AdoptionViewRepository` interface —
  dual access (applicant OR shelter member), `applicantUserId` omitted from 200 response,
  method-switched at the same path as PATCH using `matchWorkerAdoptionStatusId`
- shelter member list+add (`GET/POST /shelters/:shelterId/members`) with
  `ShelterMemberRepository` interface — paginated list, membership check via `canManageShelter`,
  409 on duplicate add, `matchWorkerShelterMemberShelterId` path matcher
- shelter member remove (`DELETE /shelters/:shelterId/members/:memberId`) with soft-delete
  (`deleted_at` timestamp), 404 on not-found, `matchWorkerShelterMemberRemoveIds` path matcher —
  registered BEFORE the list/add check, which is BEFORE the shelter profile check
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
- `GET /notifications` list route (authenticated, `limit`/`offset` query params, returns `notifications`, `total`, `unreadCount`)
- `PATCH /notifications/:id/read` mark-as-read route (authenticated, 200 or 404)
- `NotificationRepository` interface with 6 methods (`listNotifications`, `markNotificationRead`, `notifyAdoptionStatusChanged`, `notifyNewAdoptionApplication`, `notifyDonationPaid`, `notifySponsorshipStatusChanged`)
- Supabase `notifyNewAdoptionApplication` fans out to all active shelter members
- Supabase `notifyDonationPaid` resolves donor from `donation_transactions` by `providerPaymentId` + `provider`
- fire-and-forget dispatch wired into adoption-status, adoption, payment-webhook, and sponsorship-manage handlers
- `WORKER_NOTIFICATIONS_PATH` config key (default `/notifications`)
- migration `0002_notifications`: `notification_type` enum, `notifications` table, index on `(user_id, created_at desc)`, RLS policy
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
- `SponsorshipListClient` (authenticated read — `loadSponsorships(shelterId, query?)` with pagination)
- `SponsorshipManageClient` (authenticated write — `manageSponsorship(sponsorshipId, status)`)
- `SponsorshipDonorListClient` (authenticated read — `loadDonorSponsorships(query?)` — donor's own list)
- `AdoptionStatusClient` (authenticated write — `manageAdoptionStatus(applicationId, status)`)
- `AdoptionViewClient` (authenticated read — `loadAdoptionView(applicationId)`, 7 failure statuses)
- `ShelterMemberClient` (authenticated read+write — `loadShelterMembers(shelterId, query?)`, `addShelterMember(shelterId, input)`, `removeShelterMember(shelterId, memberId)`)
- `NotificationClient` (authenticated read+write — `listNotifications(query?)`, `markNotificationRead(notificationId)`) *(pending merge)*
- no client-side Supabase service-role keys or R2 credentials

Web/Mobile now have tested product boundaries for: media upload, pet media upload+attach,
pet publish, pet draft, pet draft save flow, pet feed, pet profile, shelter profile,
adoption application, adoption list (shelter-side review), donation, donation list
(shelter-side, 6 states including dedicated `forbidden`), donation status (6 states
including dedicated `not_found` + `forbidden`), sponsorship (recurring / padrinhos,
4 states including idle/submitting/submitted/failed), sponsorship list (shelter-side,
6 states including dedicated `forbidden`), sponsorship manage (cancel/pause/resume,
4 states: idle/submitting/succeeded/failed, dual access: shelter manager OR donor),
sponsorship donor list (donor-facing, 5 states: idle/loading/loaded/empty/failed, no `forbidden`),
adoption status management (shelter staff approve/reject/review, 4 states: idle/submitting/succeeded/failed),
adoption view (adopter + shelter read, 6 states: idle/loading/loaded/not_found/forbidden/failed),
shelter member management (shelter staff, 8 states: idle/loading/loaded/forbidden/failed +
member_added/member_removed/action_failed — first combined read+write boundary),
notifications (in-app, 4 states: idle/loading/loaded/failed, optimistic markRead, 4 trigger events) *(pending merge)*.

The adopter end-to-end flow is fully wired at the boundary layer:
**feed → pet profile → shelter profile → submit adoption application → view adoption status**.

The shelter-side adoption review flow is fully wired at the boundary layer:
**Worker route → client → Web + Mobile product boundaries**.

The full donation slice is wired end-to-end:
**donation intent → payment webhook → donor status polling → Web + Mobile boundaries**.

The full sponsorship slice (padrinhos) is wired end-to-end:
**sponsorship intent → Web + Mobile boundaries** (`POST /sponsorships` Worker route + `SponsorshipClient` + both product boundaries).

The full sponsorship list slice is wired end-to-end:
**`GET /shelters/:shelterId/sponsorships` Worker route → `SponsorshipListClient` → Web + Mobile product boundaries** (6 states including dedicated `forbidden`).

The full sponsorship manage slice is wired end-to-end:
**`PATCH /sponsorships/:sponsorshipId` Worker route → `SponsorshipManageClient` → Web + Mobile product boundaries** (4 states, dual access: shelter manager OR donor).

The donor-facing sponsorship list slice is wired end-to-end:
**`GET /sponsorships` Worker route → `SponsorshipDonorListClient` → Web + Mobile product boundaries** (5 states, no `forbidden`).

The adoption status management slice is fully wired end-to-end:
**`PATCH /adoptions/:applicationId` Worker route → `AdoptionStatusClient` → Web + Mobile product boundaries**.

The adoption view slice is fully wired end-to-end:
**`GET /adoptions/:applicationId` Worker route → `AdoptionViewClient` → Web + Mobile product boundaries** (6 states, dual access: applicant OR shelter member, `applicantUserId` omitted from response).

Payment state is always driven by verified server-side webhook. The `paymentWebhookVerifier`
is intentionally left unset by the factory — provider-specific HMAC adapters must be wired
per deployment.

## 5. Recommended Next Work Item

The pet archive slice is complete (PRs #90–#93). The foundation now covers:
- All write paths (pet drafts, media, adoption, donation, sponsorship, sponsorship manage, adoption status management, pet archive)
- All read paths (pet feed, pet profile, shelter profile, adoption view, adoption list, donation list/status, sponsorship list/donor-list — all 4 layers each)
- Shelter-side list views (adoption list, donation list, sponsorship list)
- Donor-facing sponsorship list (`GET /sponsorships` — `SPONSORSHIP-DONOR-LIST-*`, PRs #72–#75 — **already complete**)
- Full payment confirmation pipeline (webhook → donor status polling)
- Sponsorship lifecycle management (cancel/pause/resume — dual access: shelter OR donor)
- Adoption status management — full slice (Worker + client + Web + Mobile)
- Adoption view — full slice (Worker + client + Web + Mobile)
- Shelter member management — full slice (Worker + client + Web + Mobile, first 8-state combined read+write boundary)
- Pet archival — full slice (Worker + client + Web + Mobile, `PATCH /pets/:petId` with status: `archived | published`)

**Suggested next** (in priority order, updated 2026-06-09):
1. **Donor-facing adoption list** — Donor sees their own adoption applications (`GET /adoptions` donor-only, separate from shelter list)
2. **Pet status transitions** — Archive/re-publish workflows, audit logging, status history
3. **Payment reconciliation dashboard** — Shelter-side reporting for donations and sponsorships by date/status
4. **Notification preferences** — Opt-out per notification type, user preferences table

> **Note**: `DONOR-SPONSORSHIP-LIST` (= `SPONSORSHIP-DONOR-LIST-*`) was completed in PRs #72–#75 and is **not** a pending item. The 4 open remote branches (`ADOPTION-LIST-WORKER-001`, `MOBILE-PET-PROFILE-001`, `PET-FEED-WORKER-001`, `SHELTER-PROFILE-WORKER-001`) are all fully merged to main and can be deleted. The `agent/notifications-batch` branch is pending merge as PR #94.

## 6. Handoff Prompt For New Agent Session

Use this prompt in a new AI agent session (Claude Web UI):

```text
Read AGENTS.md, docs/agent-resume.md, docs/canonical/architecture-proposal.md, docs/canonical/sdd.md, and the latest checkpoint at docs/checkpoints/2026-06-09-pet-archive-adoption-view-shelter-member-complete.md.

Continue Pic4Paws V2 development from main using strict SDD/TDD:
- 1 branch per work item: agent/<WORK-ITEM-ID>
- Failing test first, then implementation
- Validate: npm run typecheck, lint, test, build

The `agent/notifications-batch` branch (PR #94) adds the full in-app notifications slice
(NOTIFICATION-WORKER-001, NOTIFICATION-CLIENT-001, WEB-NOTIFICATION-001, MOBILE-NOTIFICATION-001).
Merge it before starting the next item.

Pick the next recommended item or ask which to start.
```
