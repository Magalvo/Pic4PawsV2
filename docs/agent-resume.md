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
4. create or enrich the work item in `docs/work-items/` with Goal, States, Contract and Affected files sections
5. write the failing test first
6. implement the smallest change that passes
7. run validation
8. commit one coherent checkpoint
9. push branch and open PR

### Exception: batch branch

Use `agent/<FEATURE>-batch` only when all items are **entirely new** (none has production value without the others) and are **tightly coupled by type contract** (e.g. a brand-new Worker route + its client + both boundaries introduced for the first time together). Each work item must still be a separate commit within the batch. This is an exception, not the default.

Do not batch items that can be reviewed or merged independently.

### Required validation before every commit

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 4. Current State As Of 2026-06-28

**Repository status**: 2442 tests passing (274 test files). Push notifications complete. Full manual-donation slice complete + fully audit-remediated (all P1–P2 findings from 2026-06-28 audit resolved).

**Main branch HEAD**: PR #274 (P3 hygiene sweep — helpers consolidated, defensive try/catch, docs) — `1588a22`.
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅
- `npm run build` ✅

> **Note**: `packages/config/dist/` and `packages/domain/dist/` are gitignored. After pulling or switching branches, run `npm run build -w packages/config` and/or `npm run build -w packages/domain` if typecheck fails on `EnvironmentConfig` or domain types.

**Latest checkpoint**: [2026-06-23-donation-manual-complete.md](docs/checkpoints/2026-06-23-donation-manual-complete.md) — covers PRs #240–#267, 2437 tests

**Latest audit**: [2026-06-28-sdd-audit-prs-257-269.md](docs/audits/2026-06-28-sdd-audit-prs-257-269.md) — score 7/10; P1 (donation_receipt allowlist) closed by PR #272; P2-2 (push-token ladder) closed by PR #273; P3s closed by hygiene sweep. All findings resolved.

**Track E complete**: `PASSWD-RESET-WEB-001` (PR #207) + `PASSWD-RESET-MOBILE-001` (PR #208). Web: `/recuperar-palavra-passe` + `/recuperar-palavra-passe/confirmar`; mobile: `(auth)/recuperar-palavra-passe` screen (confirm step on web). Mobile `redirectTo` uses `EXPO_PUBLIC_WEB_BASE_URL ?? 'https://pic4paws.pt'`.

**Track F complete**: `SHELTER-VERIFY-001` (PR #211) + `SHELTER-VERIFY-WEB-001` + `SHELTER-VERIFY-MOBILE-001` (PR #212). Worker: `PATCH /shelters/:shelterId/verification` with `ShelterVerificationTargetStatus` (`pending_review | verified | rejected | suspended`), `canVerifyShelter` domain guard, Supabase repository, route registered before profile matcher. Client: `createShelterVerificationClient` in `@pic4paws/client`. Web: `/abrigos/:shelterId/verificar` page with dual-role panel (shelter owner submits; admin approves/rejects/suspends). Mobile: `abrigos/:shelterId/verificar` screen with same dual-role layout.

**Track G complete**: `ADMIN-PENDING-SHELTERS-WORKER-001` (PR #220) + `ADMIN-PENDING-SHELTERS-CLIENT-001` (PR #221) + `ADMIN-PENDING-SHELTERS-WEB-001` (PR #222) + `ADMIN-PENDING-SHELTERS-MOBILE-001` (PR #223) + pages (PR #224). Worker: `GET /shelters/pending-verification` with `canVerifyShelter` guard, pagination, Supabase repository filtering `pending_review` + non-deleted, oldest-first ordering. Client: `createAdminPendingSheltersClient` in `@pic4paws/client`. Web boundary: `createWebAdminPendingSheltersUi` (idle/loaded/empty/forbidden/failed). Mobile boundary: `createMobileAdminPendingSheltersUi` (same states). Pages: `/admin/abrigos-pendentes` on web + mobile; each auto-loads and links to `/abrigos/:id/verificar`.

**Supplementary items (PRs #213–#225, post-Track-F)**:
- Audit `2026-06-21-sdd-audit-prs-209-212.md` (PR #213, score 9/10) — closed by PR #214: `sanitizeReasons` applied to all specific error branches in both shelter-verify boundaries; 4 per-branch credential-leak tests added per file; `matchWorkerShelterVerificationId` ordering assertion added to route-table test; `docs/agent-resume.md` updated; checkpoint doc created.
- `SHELTER-VERIFY-NAV-001` (PR #215): "Verificar abrigo" link/button added to both web and mobile editar pages pointing to `/abrigos/:shelterId/verificar`; present in idle state only, absent from updated and failed states. No new test file — pure page wiring.
- `SHELTER-EDITAR-SUPABASE-001` (PR #216): replaced inline `createClient` with `mobileSupabaseClient` singleton in `apps/mobile/app/abrigos/[shelterId]/editar.tsx`; fixes auth-state propagation bug.
- Audit `2026-06-21-sdd-audit-prs-213-216.md` (PR #217, score 9/10) — no open P1/P2 findings.
- PRs #218–#219: docs-hygiene remediation for PR #217 follow-up. Added `status: done` frontmatter and completion notes to the recent shelter verification navigation / mobile editar work items, closed `SHELTER-VERIFY-NAV-001` acceptance criteria, strengthened `scripts/check-work-items.mjs`, and added `tests/foundation/work-item-hygiene.test.ts`.
- Audit `2026-06-21-sdd-audit-prs-217-224.md` (PR #225, score 9/10) — no open P1/P2 findings.
- PR #226 (audit #225 remediation): docs/agent-resume.md updated; checkpoint `2026-06-21-admin-pending-shelters-complete.md` written; mobile admin screen converted to `useRef` lazy-init; `ADMIN-NAV-001` implemented — "Fila de revisão" link added to shelter listing loaded state on web + mobile.

**Track H complete**: `USER-REGISTER-DB-001` + `USER-REGISTER-WORKER-001` (PR #229) + `USER-REGISTER-WEB-001` (PR #233) + `USER-REGISTER-MOBILE-001` (PR #234) + `WEB-LANDING-001` (PR #236) + `USER-REGISTER-ROLLBACK-001` (PR #237). Public `POST /users/register` (no auth token required) creates Supabase auth user via `auth.admin.createUser` then calls `register_user` RPC — password never touches the DB layer. Best-effort `auth.admin.deleteUser` rollback prevents orphaned auth accounts when the RPC fails. Web: `/registar` page with GDPR checkbox (`gdprConsentVersion: 'v1'`). Mobile: `(auth)/registar.tsx` screen with `Pressable` GDPR checkbox and `router.replace` on success. Landing page: dev dashboard replaced with real hero + CTAs + feature cards at `/`; `webFoundationContent.primaryAction.href` updated to `/registar`.
- Audit `2026-06-21-sdd-audit-prs-225-234.md` (PR #235, score 9/10) — P2-1 (orphaned auth user) closed by PR #237; P2-2 (fragile email detection) deferred.

### Merged Work Items (up to 2026-06-23)

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
- `NOTIFICATION-WORKER-001` — migration `0002_notifications`, `NotificationRepository` + Supabase impl, fire-and-forget dispatch into 4 handlers, `GET /notifications` + `PATCH /notifications/:id/read` routes
- `NOTIFICATION-CLIENT-001` — `createNotificationClient` in `@pic4paws/client` (`listNotifications` + `markNotificationRead`)
- `WEB-NOTIFICATION-001` — Web notification product boundary (4 states: idle/loading/loaded/failed, optimistic markRead)
- `MOBILE-NOTIFICATION-001` — Mobile notification product boundary with PT-PT states
- `DONOR-ADOPTION-LIST-WORKER-001` — `GET /adoptions` donor-facing route (method-switched before POST), `AdoptionDonorListRepository` + Supabase impl, no `applicantUserId` in response
- `DONOR-ADOPTION-LIST-CLIENT-001` — `createAdoptionDonorListClient` in `@pic4paws/client` (`loadDonorAdoptions`)
- `WEB-DONOR-ADOPTION-LIST-001` — Web donor adoption list product boundary (5 states: idle/loading/loaded/empty/failed)
- `MOBILE-DONOR-ADOPTION-LIST-001` — Mobile donor adoption list product boundary with PT-PT states
- `PET-REPUBLISH-WORKER-001` — `PATCH /pets/:petId/status` extended for `status: 'published'` re-publish of archived pets
- `PET-REPUBLISH-CLIENT-001` — `republishPet(petId)` added to `PetArchiveClient`
- `WEB-PET-REPUBLISH-001` — `republishPet` action added to `WebPetArchiveUi`
- `MOBILE-PET-REPUBLISH-001` — `republishPet` action added to `MobilePetArchiveUi`
- `SHELTER-SEARCH-WORKER-001` — public `GET /shelters` paginated list route with name/city/district filters, `ShelterSearchRepository` + Supabase impl
- `SHELTER-SEARCH-CLIENT-001` — `createShelterSearchClient` in `@pic4paws/client` (`searchShelters`)
- `WEB-SHELTER-SEARCH-001` — Web shelter search product boundary (5 states: idle/loading/loaded/empty/failed)
- `MOBILE-SHELTER-SEARCH-001` — Mobile shelter search product boundary with PT-PT states
- `NOTIF-PREFS-WORKER-001` — `GET/PATCH /notifications/preferences`; `NotificationPreferencesRepository` + Supabase impl; fills missing types as enabled=true; upsert with `onConflict: 'user_id,type'`
- `NOTIF-PREFS-CLIENT-001` — `createNotificationPreferencesClient` in `@pic4paws/client` (`loadPreferences` + `updatePreferences`)
- `WEB-NOTIF-PREFS-001` — Web notification preferences product boundary (3 states: idle/loaded/failed, optimistic updatePreference)
- `MOBILE-NOTIF-PREFS-001` — Mobile notification preferences product boundary with PT-PT states
- `NOTIF-PREFS-DISPATCH-001` — `notificationPreferencesRepository` injected (optional) into `createSupabaseNotificationRepositories`; `isOptedOut` helper gates each `notifyXxx`; fan-out filters per-member; backwards-compatible
- `FINANCIALS-WORKER-001` — `GET /shelters/:shelterId/financials`; `FinancialsRepository.getFinancials(shelterId)` → `FinancialsSummary`; Supabase impl aggregates donations by status + sponsorship counts/totals; registered before shelter profile check
- `FINANCIALS-CLIENT-001` — `createFinancialsClient` in `@pic4paws/client` (`loadFinancials(shelterId)`)
- `WEB-FINANCIALS-001` — Web payment reconciliation dashboard product boundary (5 states incl. loading + forbidden)
- `MOBILE-FINANCIALS-001` — Mobile payment reconciliation dashboard product boundary
- `PET-STATUS-HISTORY-001` — `pet_lifecycle_events` schema table; `recordLifecycleEvent` wired into archive/republish success path
- `PET-STATUS-HISTORY-READ-001` — `GET /pets/:petId/status-history` Worker route; `getLifecycleEvents` on `PetArchiveRepository`
- `PET-STATUS-HISTORY-CLIENT-001` — `createPetStatusHistoryClient` in `@pic4paws/client` (`loadStatusHistory(petId)`)
- `WEB-PET-STATUS-HISTORY-001` — Web pet status history product boundary (5 states: idle/loading/loaded/forbidden/failed)
- `MOBILE-PET-STATUS-HISTORY-001` — Mobile pet status history product boundary (5 states)
- `WORKER-ERROR-BOUNDARY-001` — top-level try/catch in Worker dispatcher; uncaught throws return `{ status: 'internal_server_error' }` 500 instead of opaque Cloudflare error
- `SHELTER-PETS-WORKER-001` — authenticated `GET /shelters/:shelterId/pets` Worker route returning all pets (all statuses) newest-updated-first; `matchWorkerShelterPetsShelterId`; registered before shelter profile matcher
- `SHELTER-PETS-CLIENT-001` — `createShelterPetListClient` in `@pic4paws/client` (`loadShelterPets(shelterId, query?)`)
- `WEB-SHELTER-PETS-001` — Web shelter pet list product boundary (6 states: idle/loading/loaded/empty/forbidden/failed)
- `MOBILE-SHELTER-PETS-001` — Mobile shelter pet list product boundary with PT-PT states (6 states)
- `PET-DRAFT-LOAD-WORKER-001` — `GET /pet-drafts/:petId`; loads full draft record incl. `createdAt`/`updatedAt` for edit pre-fill; GET intercepted before body-parse block; 404 before 403 (prevents timing leak)
- `PET-DRAFT-LOAD-CLIENT-001` — `loadPetDraft(petId)` added to `PetDraftClient`; maps 401/403/404/501
- `WEB-PET-DRAFT-LOAD-001` — `loadDraft` method added to `WebPetDraftUi`; 4 states: loaded/not_found/forbidden/failed; PT-PT copy
- `MOBILE-PET-DRAFT-LOAD-001` — same as web boundary with `Mobile` prefix
- `PET-FEED-FILTERS-001` — `location` query param added to `GET /pets`; `parseLocation` trims whitespace, treats blank as null; eq filter applied to both count and data Supabase queries; `PetFeedClientQuery.location` added to `@pic4paws/client`
- `SHELTER-REGISTER-WORKER-001` — `POST /shelters`; authenticated; validates name/kind/city; creates `shelters` row (`verification_status: draft`, `country_code: PT`) + `shelter_memberships` row (`role: shelter_owner`); returns `201 { status: 'created', shelterId }`. Auth ladder: 405→401→501→401→400→501→201.
- `SHELTER-REGISTER-CLIENT-001` — `createShelterRegistrationClient` in `@pic4paws/client`; POST to `{workerBaseUrl}{shelterPath}`; maps `201 created` → `{ ok: true, status: 'registered', shelterId }`; `sanitizeReasons` on all failures.
- `WEB-SHELTER-REGISTER-001` — `createWebShelterRegistrationUi`; PT-PT, product-flow-ready; 4 states: idle/submitting/registered/failed; distinct copy for `unauthenticated` and `invalid_payload`; `unsafeReasonMarkers` + `sanitizeReasons` on generic failures.
- `MOBILE-SHELTER-REGISTER-001` — same as Web boundary with `Mobile` prefix.
- `SHELTER-UPDATE-001` — `PATCH /shelters/:shelterId`; all fields optional; `validateShelterUpdatePayload` rejects empty object with `no_fields_provided`; `canManageShelter` authorization; `.maybeSingle()` for not-found detection; auth ladder: 405→401→501→401→403→400→501→404→200. Client: `createShelterUpdateClient`. Web+Mobile: 4 states (idle/submitting/updated/failed) with distinct copy for `forbidden`, `shelter_not_found`, `invalid_payload`, `unauthenticated`.
- `SHELTER-REGISTER-ATOMIC-001` — replaces two-step `shelters` + `shelter_memberships` INSERTs with a single `client.rpc('register_shelter', {...})` call; eliminates orphan-shelter risk. `SupabaseClientLike` extended with `rpc(fn, args)`; `packages/database/src/rpc-functions.ts` exports `registerShelterRpcSql` Postgres function (`security definer`).
- `SHELTER-DELETE-001` — `DELETE /shelters/:shelterId`; shelter owner / admin only (`canDeleteShelter`); soft-delete via `deleted_at`; pets cascade off public feed via join-filter without pet row changes. Client: `createShelterDeletionClient`. Web+Mobile: 4 states (idle/submitting/deleted/failed).
- `SHELTER-REGISTER-RPC-HARDEN-001` — `register_shelter` RPC hardened: `set search_path = public`, schema-qualified table names, `p_verification_status`/`p_role` removed from signature (hardcoded to `draft`/`shelter_owner`), `REVOKE EXECUTE` from public/anon/authenticated, `GRANT EXECUTE` to service_role; `p_kind` typed as `public.shelter_kind`; old 14-arg unsafe overload dropped; RPC added to `migrationArtifacts` as `0003_register_shelter_rpc`.
- `SHELTER-PROFILE-VISIBILITY-001` — public `GET /shelters/:shelterId` now filters `verification_status = 'verified'`; draft and rejected shelters return 404. Decision: Option A (public-only). No authenticated preview route added.
- `WORKER-DISPATCH-MODULAR-001` — Worker dispatcher split into 8 per-domain route modules under `apps/workers/src/routes/` (pets, shelters, adoptions, donations, sponsorships, notifications, media, webhooks); `@pic4paws/client` split into per-domain modules with `index.ts` re-exporting everything. Route ordering enforced by `tests/workers/route-table.test.ts`.
- `PUSH-TOKEN-WORKER-001` (PR #240) — `POST/DELETE /notifications/push-token` Worker routes; `PushTokenRepository` interface; `upsertPushToken` + `deletePushToken`; `PUSH_TOKEN_PLATFORMS`; `matchWorkerPushTokenPath`
- `PUSH-TOKEN-CLIENT-001` (PR #242) — `createPushTokenClient` in `@pic4paws/client` with `registerToken(token, platform)` + `unregisterToken(token)`
- `PUSH-DISPATCH-001` (PR #243) — `PushNotificationProvider` interface wired (optional, fire-and-forget) into `createSupabaseNotificationRepositories`; `sendPushNotification` dispatched from each `notifyXxx` method
- `MOBILE-PUSH-001` (PR #244) — `expo-notifications` permission prompt + token registration on app start; unregister on sign-out; wired into root `_layout.tsx`
- `DONATE-TIER-DB-001` (PR #245) — DB migration for manual donation tier: `payment_config` table; `tier` column (`manual | automated`)
- `DONATE-CONFIG-WORKER-001` (PR #246) — `GET/PATCH /shelters/:shelterId/payment-config`; `PaymentConfigRepository`; IBAN + MB WAY phone validation
- `DONATE-CONFIG-CLIENT-001` (PR #247) — `createSavePaymentConfigClient` + `createLoadPaymentConfigClient` in `@pic4paws/client`
- `DONATE-TIER-WORKER-001` (PR #248) — donation tier routing: `manual` tier sets `initialStatus: pending_receipt` instead of `pending_payment`
- `DONATE-MANUAL-WORKER-001` (PR #249) — `PATCH /donations/:id/receipt` (submit receipt) + `PATCH /donations/:id/review` (approve/reject); `DonationManualRepository`; `verifyMediaOwnership`
- `DONATE-MANUAL-CLIENT-001` (PR #250) — `createSubmitReceiptClient` + `createReviewDonationClient` + `createMediaUploadFlowClient` in `@pic4paws/client`
- `WEB-DONATE-CONFIG-001` (PR #251) — `createWebShelterPaymentConfigUi`; idle/saving/saved/failed states; PT-PT
- `MOBILE-DONATE-CONFIG-001` (PR #252) — `pagamento.tsx` screen; `createMobileShelterPaymentConfigUi`; `useRef` lazy-init
- `WEB-DONATE-RECEIPT-001` (PR #253) — `createWebDonationReceiptUi`; idle/uploading/submitting/submitted/wrong_state/forbidden/failed states
- `MOBILE-DONATE-RECEIPT-001` (PR #254) — `comprovativo.tsx` screen; `expo-image-picker`; `isUploading` disabled-button guard; try/catch
- `WEB-DONATE-REVIEW-001` (PR #255) — `createWebDonationReviewUi`; idle/loading/loaded/approved/rejected/forbidden/failed states; shelter-side review panel
- `MOBILE-DONATE-REVIEW-001` (PR #256) — `doacoes/[donationId].tsx` screen; `createMobileDonationReviewUi`; `mobileSupabaseClient` singleton; `uiRef` null-guards

Real UI screens, auth, and navigation (PRs #157–#199):

- `WEB-AUTH-PAGE-001` / `MOBILE-AUTH-SCREEN-001` — sign-in page/screen using `createWebAuthUi` / `createMobileAuthUi`; PT-PT; `persistSession: false` on mobile; sanitization tests assert both `service-role` and `bearer ` absent from failed state
- `WEB-NAV-001` — Next.js middleware auth guard: `createServerClient` from `@supabase/ssr`, `getUser()` for server-validated JWT, `isPublicRoute` for `/entrar`/`/animais`/`/abrigos` and their detail pages, return-URL via `?next=` with `validateNextPath` validation; `apps/web/src/supabase-browser.ts` updated to `createBrowserClient` so cookies are set for middleware to read
- `MOBILE-NAV-001` — Expo Router navigation shell: root `_layout.tsx` session guard with `mobileSupabaseClient` singleton, `(auth)` group (Stack, `entrar.tsx` with `returnTo`), `(app)/(tabs)` group (5-tab Tabs: Animais / Adoções / Patrocínios / Abrigos / Notificações); `apps/mobile/src/nav.ts` with `validateReturnTo`
- `MOBILE-AUTH-P1-001` — fixed two-client bug: `apps/mobile/src/supabase.ts` exports `mobileSupabaseClient` singleton shared by root layout and sign-in screen so `onAuthStateChange` fires correctly after sign-in
- `WEB-MIDDLEWARE-P1-001` — replaced `getSession()` with `getUser()` in middleware; added `tests/web/middleware.test.ts` (7 tests covering unauthenticated redirect, public pass-throughs, open-redirect rejection, authenticated `/entrar` redirect)
- All SCREEN work items for web and mobile (adoption, donation, sponsorship, notification, shelter, pet screens) — wired existing product-boundary components into real Expo Router and Next.js App Router pages

Security hardening + audit remediation (PRs #149–#156):
- `DB-SHELTER-GEO-001` — canonical geographic coordinate contract: `decimal`/`numeric` in Postgres, `number | null` at TS boundaries, validation before persistence.
- `SDD-WORKITEM-HYGIENE-001` — CI script (`scripts/check-work-items.mjs`) enforces work item envelope (Goal/States/Contract/Files sections); path separators normalized for cross-platform.
- `DOMAIN-CANON-001` — `@pic4paws/domain` public API pruned to canonical Portugal-first contracts; prototype feed fixtures and US demo data removed from package exports.
- `RLS-002` — complete core RLS policy matrix: explicit `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies on all tenant-owned and personal-data tables; RLS now independently enforces the same access boundaries as Workers.
- `MEDIA-UPLOAD-AUTH-001` — signed media upload URLs require authenticated requests; dry-run metadata without signed URL allowed only in non-production environments.
- `DONATION-ELIGIBILITY-001` — server-side eligibility gate before creating donation intents: verifies shelter, pet, payment account, and provider/method; client claims cannot decide payment state.
- `PAYMENT-WEBHOOK-002` — payment webhook processing uses a single auditable server-side transition; idempotency preserved, PSP event IDs attached to donation, no client-claim state mutation, timestamp columns protected.
- `PAYMENT-WEBHOOK-VERIFIER-001` — `PAYMENT_WEBHOOKS_ENABLED` feature flag gates the webhook endpoint; without an injected provider verifier the endpoint returns 503; prevents silent unverified payment state mutation in production.

The Worker now has (as of 2026-06-13, PR #136):

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
- authenticated shelter pet list (`GET /shelters/:shelterId/pets`) with
  `ShelterPetListRepository` interface — all statuses, paginated (limit 20/max 100), newest-updated-first,
  `matchWorkerShelterPetsShelterId` path matcher; registered BEFORE shelter profile check
- `GET /pet-drafts/:petId` load draft for edit pre-fill — `loadDraft` on `PetDraftRepository`,
  GET intercepted before body-parse, 404 checked before 403 (prevents timing leak on existence)
- `GET /pets` with `location` query filter (trimmed, blank=null, applied to both count + data Supabase queries)
- top-level try/catch error boundary — uncaught throws return `{ status: 'internal_server_error' }` 500
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
- `POST /shelters` shelter registration (auth) — `canManageShelter` check, slug derived from name, atomic via `register_shelter` Supabase RPC
- `PATCH /shelters/:shelterId` shelter profile update (auth, `canManageShelter`) — partial update, `toColumnMap`, not-found via `.maybeSingle()`
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
- `NotificationClient` (authenticated read+write — `listNotifications(query?)`, `markNotificationRead(notificationId)`)
- `ShelterSearchClient` (public read — `searchShelters(query?)`)
- `NotificationPreferencesClient` (authenticated read+write — `loadPreferences()`, `updatePreferences(preferences[])`)
- `FinancialsClient` (authenticated read — `loadFinancials(shelterId)`)
- `PetStatusHistoryClient` (authenticated read — `loadStatusHistory(petId)`)
- `ShelterPetListClient` (authenticated read — `loadShelterPets(shelterId, query?)` with pagination)
- `PetDraftClient.loadPetDraft(petId)` (authenticated read — pre-fill load for edit form)
- `PetFeedClient.loadFeed` updated — `location` filter added to `PetFeedClientQuery`
- `ShelterRegistrationClient` (authenticated write — `registerShelter(input)`)
- `ShelterUpdateClient` (authenticated write — `updateShelter(shelterId, input)`)
- `UserRegistrationClient` (public write — `registerUser(input)`; no auth token required)

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
notifications (in-app, 4 states: idle/loading/loaded/failed, optimistic markRead, 4 trigger events),
shelter search (public, 5 states: idle/loading/loaded/empty/failed),
notification preferences (3 states: idle/loaded/failed, optimistic updatePreference),
financials dashboard (shelter-side, 5 states: idle/loading/loaded/forbidden/failed),
pet status history (shelter-side audit log, 5 states: idle/loading/loaded/forbidden/failed),
shelter-side pet list (all statuses, 6 states: idle/loading/loaded/empty/forbidden/failed),
pet draft pre-fill load (edit form, 4 states: loaded/not_found/forbidden/failed),
shelter registration (4 states: idle/submitting/registered/failed),
shelter profile update (4 states: idle/submitting/updated/failed, with forbidden/not_found/invalid_payload variants),
user account registration (4 states: idle/submitting/registered/failed, public — no auth required, GDPR checkbox).

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

**Status as of 2026-06-28**: Tracks A–H complete. GDPR-LEGAL-001 merged (PR #239). Push notifications done (PRs #240–#244). Full manual donation slice done (PRs #245–#256) + fully audit-remediated — all P1/P2/P3 findings from 2026-06-28 audit resolved (PRs #272–#274). 2442 tests passing.

**Production-readiness gaps (confirmed):**

1. ~~**GDPR legal pages**~~ — **Done** (`GDPR-LEGAL-001`, PR #239).

2. **Payment provider env wiring** — `paymentWebhookVerifier` is `null` by factory default; Ifthenpay credentials must be configured in production `.env`. Not a code work item — deployment config. Blocks donations/sponsorships in production.

3. ~~**Push notification delivery**~~ — **Done** (PRs #240–#244). `PUSH-TOKEN-WORKER-001` → `PUSH-TOKEN-CLIENT-001` → `PUSH-DISPATCH-001` → `MOBILE-PUSH-001` all merged. `expo-notifications` installed in `apps/mobile`.

4. **Mobile app store artifacts** — EAS build configuration, app icons, splash screens, bundle identifiers not yet set up. Required before App Store / Play Store submission.

**Recommended next**: consult `docs/work-tracks/remake-foundation.md` for the next planned track. Consider running a fresh SDD audit (`/sdd-audit`) to establish the new baseline before the next feature track begins.

**Known deferred items:**
- Mobile routing integration test (unauthenticated → redirect → sign-in → `returnTo`) requires React Native Testing Library setup.
- P2-2 (fragile `isEmailAlreadyRegistered` string matching in `apps/workers/src/user-register-supabase.ts`) — deferred until Supabase SDK upgrade provides a stable error code.

## 6. Handoff Prompt For New Agent Session

Use this prompt in a new AI agent session:

```text
Read AGENTS.md and docs/agent-resume.md first.

Continue Pic4Paws V2 development from main using strict SDD/TDD:
- 1 branch per work item: agent/<WORK-ITEM-ID>
- Failing test first, then implementation
- Validate: npm run typecheck, lint, test, build
- After any env.ts change: npm run build --workspace=packages/config

Current state (2026-06-28, HEAD 1588a22 / PR #274): 2442 tests passing (274 files).
Tracks A–H complete. GDPR legal pages done (PR #239). Push notifications done (PRs #240–#244).
Full manual donation slice done + fully audit-remediated (PRs #245–#256, #261–#267, #272–#274).
All 2026-06-28 audit findings (P1–P3) resolved.
Next: consult docs/work-tracks/remake-foundation.md for the next planned track, or run a
fresh SDD audit (/sdd-audit) to establish the new baseline before the next feature track.
Consult section 5 for the full production-readiness gap list.
```
