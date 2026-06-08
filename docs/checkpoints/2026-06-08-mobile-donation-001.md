# Checkpoint: Full Donation Slice Complete

Date: 2026-06-08
Last merged: `agent/MOBILE-DONATION-001` (PR #50)

## Summary

Completed the full donation slice — Worker route + shared client + Web + Mobile product
boundaries. The donation intent flow is now fully wired end-to-end at every layer.

## Items Merged In This Session

- **DONATION-CLIENT-001** (PR #48) — `createDonationClient` in `@pic4paws/client`.
  `submitDonation(input)` → `DonationClientResult`. Bearer auth, network error handling,
  `parseDonationSuccess` validation, `sanitizeReasons` credential stripping.
  `DonationClientFailureStatus`: `unauthenticated | invalid_donation |
  donation_repository_not_configured | auth_adapter_not_configured |
  worker_request_failed | worker_response_invalid`. 10 tests.

- **WEB-DONATION-001** (PR #49) — Web donation product boundary. `createWebDonationUi
  ({ donationClient })` with `getInitialState` + `submitDonation`. States: `idle`,
  `submitting`, `submitted` (donationId, amountCents, currency, kind, shelterId, createdAt),
  `failed` (status, reasons, canRetry: true). `webDonationUiContent` (pt-PT,
  product-flow-ready). `webFoundationContent.donation` entry. 9 tests.

- **MOBILE-DONATION-001** (PR #50) — Mobile donation product boundary. Mirrors
  WEB-DONATION-001 with `Mobile`-prefixed types. `mobileDonationUiContent` (pt-PT,
  product-flow-ready). `mobileFoundationContent.donation` entry. 9 tests.

## Files Changed

**DONATION-CLIENT-001:**
- `packages/client/src/index.ts` — appended donation client types + `createDonationClient`
- `tests/client/donation-client.test.ts` — new (10 tests)
- `docs/work-items/DONATION-CLIENT-001-donation-client.md` — new

**WEB-DONATION-001:**
- `apps/web/src/donation.ts` — new
- `apps/web/src/foundation.ts` — added `donation` entry
- `tests/web/donation-ui.test.ts` — new (9 tests)
- `docs/work-items/WEB-DONATION-001-web-donation-ui.md` — new

**MOBILE-DONATION-001:**
- `apps/mobile/src/donation.ts` — new
- `apps/mobile/src/foundation.ts` — added `donation` entry
- `tests/mobile/donation-ui.test.ts` — new (9 tests)
- `docs/work-items/MOBILE-DONATION-001-mobile-donation-ui.md` — new

## Validation

- `npm run typecheck` — passed (15/15)
- `npm run lint` — passed (8/8)
- `npm run test` — 465/465 passed (75 test files)
- `npm run build` — passed (9/9)

## Current State

The full donation intent flow is wired:
- Worker: `POST /donations` — authenticated, `amountCents ≥ 100`, GDPR gate,
  `donorUserId` from actor, status `created`
- Client: `createDonationClient` — `submitDonation(input)` → `DonationClientResult`
- Web: `createWebDonationUi` — idle/submitting/submitted/failed states, PT-PT copy
- Mobile: `createMobileDonationUi` — same pattern, Mobile prefix

Payment state is always driven by server-side webhook (not yet implemented at Worker level).

## Recommended Next Work Item

**DONATION-LIST-WORKER-001** — Shelter-side donation list Worker route.

- Route: `GET /shelters/:shelterId/donations`
- Auth: `WorkerPetDraftAuthenticator` (shelter membership check)
- Pagination: `limit` / `offset` query params
- Repository: `DonationListRepository` with `listDonations(shelterId, query)`
- Response shape: `{ status: 'donation_list_loaded', donations: [...], total: number }`
- Each item: `donationId`, `kind`, `status`, `amountCents`, `currency`, `paymentMethod`,
  `anonymous`, `donorDisplayName`, `publicMessage`, `createdAt`
- Pattern: mirrors `ADOPTION-LIST-WORKER-001` exactly

Then:
- `DONATION-LIST-CLIENT-001` — `createDonationListClient` in `@pic4paws/client`
- `WEB-DONATION-LIST-001` — Web donation list product boundary
- `MOBILE-DONATION-LIST-001` — Mobile donation list product boundary
