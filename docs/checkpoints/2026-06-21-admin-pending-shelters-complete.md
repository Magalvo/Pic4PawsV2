---
date: 2026-06-21
tracks: A–G
prs: "#157–#224"
tests: 2097
---

# Checkpoint: Admin Pending Shelters Complete (2026-06-21)

This checkpoint covers Tracks A–G and all supplementary items through PR #224 (plus
the audit report PR #225). It extends the prior checkpoint
`2026-06-21-shelter-verification-complete.md` which covered Tracks A–F through PR #212.

## Validation gates at PR #224 (`b45b281`)

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 2097 tests (254 test files)
- `npm run build` ✅
- `npm run check:sdd-work-items` ✅

---

## Track G — Admin Pending Shelters Review Queue

### ADMIN-PENDING-SHELTERS-WORKER-001 (PR #220)

Worker route `GET /shelters/pending-verification`:
- `canVerifyShelter` authorization guard (403 for non-admins)
- Bearer token extraction + Supabase auth adapter
- Supabase repository: filters `verification_status = 'pending_review'`, excludes
  soft-deleted rows, orders oldest-first (`updated_at ASC`), supports `limit`/`offset`
  pagination with exact `count`
- `parseLimit` clamps [1, 50], defaults 20; `parseOffset` clamps 0+, defaults 0
- GDPR data minimization: explicit column allowlist excludes `taxId`,
  `registrationNumber`, `address`, and payment fields
- Route registered at line 51 in `apps/workers/src/routes/shelters.ts`, before
  `matchWorkerShelterProfileId` at line 113 — prevents `/shelters/pending-verification`
  being claimed as a shelter profile ID
- Route-table test: asserts `matchWorkerAdminPendingSheltersPath` claims the path and
  `matchWorkerShelterProfileId` would return `'pending-verification'` as a shelter ID,
  documenting the ordering hazard

### ADMIN-PENDING-SHELTERS-CLIENT-001 (PR #221)

`createAdminPendingSheltersClient` exported from `@pic4paws/client`:
- Blank/null access token short-circuits to `unauthenticated` without a Worker request
- `limit` and `offset` appended to query string only when provided
- Failure mapping: 401 → `unauthenticated`, 403 → `forbidden`,
  501 → `auth_adapter_not_configured` / `admin_pending_shelters_repository_not_configured`,
  thrown errors → `worker_request_failed`, malformed 200 → `worker_response_invalid`
- Reasons sanitized before being returned on all failure paths

### ADMIN-PENDING-SHELTERS-WEB-001 (PR #222)

`createWebAdminPendingSheltersUi` in `apps/web/src/admin-pending-shelters.ts`:
- States: `idle` / `loaded` / `empty` / `forbidden` / `failed`
- `getInitialState()` returns `idle` with PT-PT copy
- Loaded items include `reviewHref: /abrigos/:shelterId/verificar`
- `forbidden` maps to dedicated state (no `reasons` field)
- All other failures map to `failed` with `sanitizeReasons` applied
- Content exports `locale: 'pt-PT'`, `status: 'product-flow-ready'`

### ADMIN-PENDING-SHELTERS-MOBILE-001 (PR #223)

`createMobileAdminPendingSheltersUi` in `apps/mobile/src/admin-pending-shelters.ts`:
- Identical contract and state machine as the web boundary
- Same sanitization guarantees

### ADMIN-PENDING-SHELTERS-WEB-PAGE-001 + MOBILE-PAGE-001 (PR #224)

`apps/web/app/admin/abrigos-pendentes/page.tsx`:
- App Router `'use client'` page
- `useRef<AdminPendingSheltersUi>` for lazy init — client and UI created once
- `getAccessToken` calls `supabase.auth.getSession()` on every invocation (fresh token)
- Auto-loads on mount; renders all 5 states in PT-PT
- Loaded list: `<a href={shelter.reviewHref}>` for each shelter
- Failed + unauthenticated: shows sign-in link to `/entrar`

`apps/mobile/app/admin/abrigos-pendentes.tsx`:
- Expo Router screen
- `FlatList` with `TouchableOpacity` per shelter → `router.push(item.reviewHref)`
- Uses `mobileSupabaseClient` singleton (no inline `createClient`)
- All 5 states handled in PT-PT

---

## Supplementary items since Track F (PRs #213–#225)

| PR | Item | Notes |
|---|---|---|
| #213 | Audit report | `2026-06-21-sdd-audit-prs-209-212.md`, score 9/10 |
| #214 | Audit remediation | `sanitizeReasons` on all specific error branches; 4 per-branch credential-leak tests per boundary file; `matchWorkerShelterVerificationId` ordering test |
| #215 | `SHELTER-VERIFY-NAV-001` | "Verificar abrigo" link/button on web + mobile editar pages |
| #216 | `SHELTER-EDITAR-SUPABASE-001` | Replace inline `createClient` with `mobileSupabaseClient` singleton in mobile editar screen |
| #217 | Audit report | `2026-06-21-sdd-audit-prs-213-216.md`, score 9/10 |
| #218–#219 | Docs hygiene | `status: done` frontmatter; `check-work-items.mjs` strengthened; `work-item-hygiene.test.ts` added |
| #225 | Audit report | `2026-06-21-sdd-audit-prs-217-224.md`, score 9/10 |

---

## Known deferred items

- **Mobile routing integration test**: full auth-guard round-trip
  (unauthenticated → redirect → sign-in → `returnTo`) requires React Native Testing
  Library. Not yet set up. Tracked in `MOBILE-NAV-001` completion notes.
- **`ADMIN-NAV-001`**: navigation entry point to `/admin/abrigos-pendentes` from the
  shelter listing page. Same pattern as `SHELTER-VERIFY-NAV-001`. No work item yet.
