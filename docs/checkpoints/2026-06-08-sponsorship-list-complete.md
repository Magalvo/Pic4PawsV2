# Checkpoint: Full Sponsorship List Slice Complete

**Date:** 2026-06-08
**PRs merged:** #64 (SPONSORSHIP-LIST-WORKER-001), #65 (SPONSORSHIP-LIST-CLIENT-001), #66 (WEB-SPONSORSHIP-LIST-001), #67 (MOBILE-SPONSORSHIP-LIST-001)

## What was completed

The full shelter-side sponsorship list (padrinhos) slice is end-to-end wired:

### SPONSORSHIP-LIST-WORKER-001 (PR #64)
- `GET /shelters/:shelterId/sponsorships` authenticated Worker route
- `SponsorshipStatus = 'active' | 'cancelled' | 'paused'`
- `SponsorshipListSummary` includes `sponsorshipId`, `amountCents`, `currency`, `paymentMethod`, `recurringInterval`, `status`, `petId`, `createdAt`
- `SponsorshipListRepository` interface: `listSponsorships({ shelterId, limit, offset })` → `{ sponsorships, total }`
- `createSupabaseSponsorshipListRepositories` Supabase impl in `sponsorship-list-supabase.ts`
- `matchWorkerSponsorshipListShelterId` path matcher (uses `shelterPath`, NOT `sponsorshipsPath`)
- Route block placed BEFORE exact `sponsorshipsPath` POST route in `index.ts`
- Pagination via `limit` / `offset` query params (default `limit=20`, max `limit=100`)
- `canManageShelter` shelter-membership check → 403
- 15 tests

### SPONSORSHIP-LIST-CLIENT-001 (PR #65)
- `createSponsorshipListClient` in `@pic4paws/client`
- `SponsorshipClientStatus = 'active' | 'cancelled' | 'paused'`
- `SponsorshipListItem` reuses `DonationClientPaymentMethod` and `SponsorshipClientRecurringInterval`
- `SponsorshipListQuery = { limit?: number | null; offset?: number | null }`
- All 6 failure statuses: `unauthenticated | forbidden | sponsorship_list_repository_not_configured | auth_adapter_not_configured | worker_request_failed | worker_response_invalid`
- URL constructed via `createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'sponsorships')`
- 10 tests

### WEB-SPONSORSHIP-LIST-001 (PR #66)
- `apps/web/src/sponsorship-list.ts` — 6 states (idle/loading/loaded/empty/forbidden/failed), PT-PT copy
- `createWebSponsorshipListUi({ sponsorshipListClient })`
- `webSponsorshipListUiContent` with `locale: 'pt-PT'`, `status: 'product-flow-ready'`
- Dedicated `forbidden` state separate from `failed`
- `apps/web/src/foundation.ts` — `sponsorshipList` entry added
- 10 tests

### MOBILE-SPONSORSHIP-LIST-001 (PR #67)
- `apps/mobile/src/sponsorship-list.ts` — exact mirror with `Mobile` prefix
- `createMobileSponsorshipListUi({ sponsorshipListClient })`
- `mobileSponsorshipListUiContent` with `locale: 'pt-PT'`, `status: 'product-flow-ready'`
- Dedicated `forbidden` state separate from `failed`
- `apps/mobile/src/foundation.ts` — `sponsorshipList` entry added
- 10 tests

## Validation state (at PR #67)

- 650 tests passing
- TypeScript strict mode clean
- ESLint clean
- Build successful (Next.js + Workers + all packages)

## Foundation status

The Pic4Paws V2 foundation now covers:

| Domain | Write | Read (public) | List (shelter-side) |
|--------|-------|---------------|---------------------|
| Media | ✅ | — | — |
| Pet drafts | ✅ | ✅ (feed + profile) | — |
| Shelter profiles | — | ✅ | — |
| Adoptions | ✅ | — | ✅ |
| Donations | ✅ | ✅ (status polling) | ✅ |
| Sponsorships | ✅ | — | ✅ |

## Recommended next work item

**`SPONSORSHIP-MANAGE-WORKER-001`** — Shelter-side sponsorship state management.

Design sketch:
- `PATCH /sponsorships/:sponsorshipId` — authenticated, cancel/pause/resume a sponsorship
- Shelter membership check: requester must manage the shelter that owns the sponsorship
- `SponsorshipManageRepository` interface: `updateSponsorshipStatus({ sponsorshipId, status })`
- Returns `{ status: 'ok', sponsorshipId, status: SponsorshipStatus }`

Alternatively, begin a new domain slice (shelter member management, notifications, pet status transitions).
