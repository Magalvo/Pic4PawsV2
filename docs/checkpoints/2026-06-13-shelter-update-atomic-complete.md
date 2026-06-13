# Checkpoint — 2026-06-13 — Shelter Update + Atomic Registration Complete

## Status

**Main branch HEAD**: PR #136 (`feat: SHELTER-REGISTER-ATOMIC-001 atomic shelter registration via RPC`)
**Tests**: 1505 passing / 167 test files
**Validation**: `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run test` ✅ · `npm run build` ✅

## What Shipped Since Last Checkpoint (2026-06-12)

### PR #131 — Docs housekeeping
Updated `docs/agent-resume.md` and created checkpoint `2026-06-12-shelter-registration-ready.md` to reflect PR #130 state.

### PR #132 — SHELTER-REGISTER-001-batch (shelter registration, 4 layers)
Full shelter registration slice shipped as a batch branch (all layers entirely new):
- `SHELTER-REGISTER-WORKER-001` — `POST /shelters`; authenticated; validates name/kind/city; creates `shelters` row (`verification_status: draft`, `country_code: PT`) + `shelter_memberships` row (`role: shelter_owner`) via two Supabase inserts; returns `201 { status: 'created', shelterId }`. Auth ladder: 405→401→501→401→400→501→201.
- `SHELTER-REGISTER-CLIENT-001` — `createShelterRegistrationClient` in `@pic4paws/client`; POST to `{workerBaseUrl}{shelterPath}`; maps `201 created` → `{ ok: true, status: 'registered', shelterId }`; `sanitizeReasons` on all failures.
- `WEB-SHELTER-REGISTER-001` — `createWebShelterRegistrationUi`; PT-PT, product-flow-ready; 4 states: `idle/submitting/registered/failed`; distinct copy for `unauthenticated` and `invalid_payload`; `unsafeReasonMarkers` + `sanitizeReasons` on generic failures; `shelterRegistration` entry in `webFoundationContent`.
- `MOBILE-SHELTER-REGISTER-001` — same as Web with `Mobile` prefix.
- 10 new test files; `tests/workers/shelter-search.test.ts` updated (`POST /shelters` now routes to registration → returns 401, not 405).

### PR #133 — SHELTER-UPDATE-001 (shelter update, 4 layers)
- `apps/workers/src/shelter-update.ts` — `PATCH /shelters/:shelterId`; all fields optional; `validateShelterUpdatePayload` rejects empty object with `no_fields_provided`; `canManageShelter` authorization; auth ladder: 405→401→501→401→403→400→501→404→200.
- `apps/workers/src/shelter-update-supabase.ts` — `toColumnMap` maps only present fields to snake_case columns; `.maybeSingle()` for not-found detection (no `code` on `SupabaseErrorLike`).
- `packages/client/src/index.ts` — `createShelterUpdateClient`; PATCH to `{workerBaseUrl}{shelterPath}/{shelterId}`; maps `200 updated` → `{ ok: true, status: 'updated', shelterId }`.
- Web + Mobile boundaries — `createWebShelterUpdateUi` / `createMobileShelterUpdateUi`; 4 states: `idle/submitting/updated/failed`; distinct copy for `forbidden`, `shelter_not_found`, `invalid_payload`, `unauthenticated`; `shelterUpdate` entry in foundation.
- 5 new test files.

### PR #134 — SDD audit report (PRs #129–#133)
Audit score 9/10. Active findings:
- D1 (medium): shelter registration non-atomic two-step DB insert → fixed in PR #136.
- D3 (low, recommendation): add work-item status-close step to AGENTS.md PR checklist → fixed in PR #135.

### PR #135 — Audit fixes (D3 + D1 work item)
- `AGENTS.md` General rules: added "When merging a PR, update every work item covered by that PR to `status: done`."
- `docs/work-items/SHELTER-REGISTER-ATOMIC-001-atomic-shelter-registration.md` created (status: draft → done in PR #136).

### PR #136 — SHELTER-REGISTER-ATOMIC-001 (atomic shelter registration via RPC)
- `apps/workers/src/pet-supabase.ts` — `SupabaseClientLike` gains `rpc(fn, args)` method.
- `apps/workers/src/shelter-register-supabase.ts` — two sequential `.from().insert()` calls replaced with a single `client.rpc('register_shelter', {...})` call; eliminates orphan-shelter risk.
- `packages/database/src/rpc-functions.ts` — `registerShelterRpcSql` constant: Postgres function wrapping both inserts in one transaction (`security definer`).
- 10 existing Supabase test mock clients updated with `rpc` stub.
- `tests/workers/shelter-register-supabase.test.ts` rewritten: verifies `rpc` called with `'register_shelter'`, `from` not called, slug/role/country_code/verification_status args correct.

## Complete Feature Inventory (as of PR #136)

### Worker routes
- `POST /pets/drafts` — create pet draft (auth)
- `PATCH /pets/drafts/:petId` — update pet draft (auth)
- `GET /pet-drafts/:petId` — load pet draft for edit pre-fill (auth)
- `PATCH /pets/:petId/status` — publish / archive / republish (auth)
- `GET /pets/:petId/status-history` — lifecycle event log (auth)
- `POST /uploads/media` — signed upload intent (auth)
- `PUT /uploads/media/:mediaId` — binary upload (auth)
- `PATCH /pets/:petId/media` — attach media to pet (auth)
- `GET /pets` — public pet feed (species + location filters, pagination)
- `GET /pets/:petId` — public pet profile
- `GET /shelters/:shelterId` — public shelter profile
- `GET /shelters` — public shelter search
- `GET /shelters/:shelterId/pets` — shelter-side pet list, all statuses (auth)
- `POST /shelters` — shelter registration (auth)
- `PATCH /shelters/:shelterId` — shelter profile update (auth, `canManageShelter`)
- `GET /shelters/:shelterId/adoptions` — shelter adoption list (auth)
- `PATCH /adoptions/:applicationId` — adoption status management (auth, shelter-only)
- `GET /adoptions/:applicationId` — adoption view (auth, dual: applicant OR shelter)
- `GET /adoptions` — donor adoption list (auth, donor-own)
- `POST /adoptions` — submit adoption application (auth)
- `GET /shelters/:shelterId/donations` — shelter donation list (auth)
- `POST /donations` — donation intent (auth)
- `GET /donations/:donationId` — donor status polling (auth)
- `POST /webhooks/payments` — payment webhook (server-to-server)
- `POST /sponsorships` — sponsorship intent (auth)
- `GET /shelters/:shelterId/sponsorships` — shelter sponsorship list (auth)
- `PATCH /sponsorships/:sponsorshipId` — sponsorship manage (auth, dual: shelter OR donor)
- `GET /sponsorships` — donor sponsorship list (auth)
- `GET /shelters/:shelterId/members` — shelter member list (auth)
- `POST /shelters/:shelterId/members` — add shelter member (auth)
- `DELETE /shelters/:shelterId/members/:memberId` — remove shelter member (auth)
- `GET /notifications` — notification list (auth)
- `PATCH /notifications/:id/read` — mark notification read (auth)
- `GET /notifications/preferences` — notification preferences (auth)
- `PATCH /notifications/preferences` — update notification preferences (auth)
- `GET /shelters/:shelterId/financials` — financial summary (auth)

## Next Steps

1. **Docs housekeeping** — update `agent-resume.md` to reflect PR #136 state ← current PR
2. **SHELTER-DELETE-001** — `DELETE /shelters/:shelterId`; authenticated shelter owner only; soft-delete (`deleted_at` timestamp); cascades visibility (pets hidden from public feed); 4-layer slice
