# Checkpoint — 2026-06-12 — Shelter Registration Ready

## Status

**Main branch HEAD**: PR #130 (`fix(audit): address 2026-06-12 SDD audit findings D1 and D2`)
**Tests**: 1391 passing / 157 test files
**Validation**: `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run test` ✅ · `npm run build` ✅

## What Shipped Since Last Checkpoint (2026-06-10)

### PR #122 — Docs housekeeping
Stale work item statuses updated; agent-resume and checkpoint updated to reflect PR #121 state.

### PR #123 — WORKER-ERROR-BOUNDARY-001
Top-level `try/catch` in `handleWorkerRequest`. Uncaught Worker throws now return `{ status: 'internal_server_error' }` with HTTP 500 instead of an opaque Cloudflare error page.

### PR #124 — SDD audit report (PRs #114–#123)
Audit score 7/10. Findings: missing `tests/tsconfig.json` typecheck gate, AGENTS.md/sdd.md policy drift, `makeRepository` base default wrong.

### PR #125 — Audit fix (PRs #114–#123 findings)
- Added `tests/tsconfig.json`; root `typecheck` script now runs `tsc --noEmit -p tests/tsconfig.json`
- Aligned `AGENTS.md` / `docs/canonical/sdd.md` / `.instructions.md` with current conventions
- Fixed `makeRepository` base default

### PR #126 — SHELTER-PETS-001 (4 layers, 57+ tests)
`GET /shelters/:shelterId/pets` — authenticated shelter-side pet list. Returns all pets for the shelter across all statuses, paginated, newest-updated-first. Route registered before shelter profile matcher. Auth ladder: 405→401→501→401→403→501→200.

### PR #127 — PET-DRAFT-LOAD-001 (4 layers, 5 new test files)
`GET /pet-drafts/:petId` — loads full draft record including `createdAt`/`updatedAt` for edit form pre-fill. GET intercepted before body-parse block. 404 checked before 403 to prevent timing leaks on draft existence.

### PR #128 — PET-FEED-FILTERS-001
`location` query filter added to `GET /pets`. `parseLocation` trims whitespace, treats blank as null. Eq filter applied to both count and data Supabase queries, mirroring the existing species filter. `PetFeedClientQuery.location` added to `@pic4paws/client`.

### PR #129 — SDD audit report (PRs #125–#128)
Audit score 8/10. Findings: client-layer sanitization tests used specific literal strings instead of pattern substrings for `service-role`/`bearer`; 4 SHELTER-PETS work items still marked `in-progress`.

### PR #130 — Audit fix (PRs #125–#128 findings)
- `tests/client/pet-draft-load-client.test.ts` and `tests/client/pet-feed-client.test.ts`: assertions changed to `not.toContain('service-role')` and `not.toContain('bearer ')`
- 4 SHELTER-PETS work items: `status: in-progress` → `status: done`

## Complete Feature Inventory (as of PR #130)

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

### Missing (next to implement)
- `POST /shelters` — **shelter registration** (auth; creates shelter + first `shelter_memberships` row with role `shelter_owner`)

## Next Steps

1. `SHELTER-REGISTER-WORKER-001` — `POST /shelters` Worker route
2. `SHELTER-REGISTER-CLIENT-001` — `registerShelter` in `@pic4paws/client`
3. `WEB-SHELTER-REGISTER-001` — Web shelter registration boundary
4. `MOBILE-SHELTER-REGISTER-001` — Mobile shelter registration boundary
