# Checkpoint: DONATION-WORKER-001

Date: 2026-06-08
Branch: `agent/DONATION-WORKER-001`
Base: `main` commit `bea4bac`

## Summary

Completed the donation Worker route, concluding a session that also merged
MOBILE-ADOPTION-LIST-001. The Worker now accepts authenticated donation intent
requests at `POST /donations`.

## Items Merged In This Session

- **MOBILE-ADOPTION-LIST-001** — Mobile adoption list product boundary. Mirror of
  WEB-ADOPTION-LIST-001 with `Mobile`-prefixed types, `mobileAdoptionListUiContent`
  (PT-PT, `product-flow-ready`), dedicated `forbidden` state, credential sanitization,
  and `adoptionList` entry in `mobileFoundationContent`. 8 tests.

- **DONATION-WORKER-001** — Authenticated `POST /donations` Worker route. Added
  `WORKER_DONATIONS_PATH` config (default `/donations`); `DonationKind`,
  `DonationPaymentMethod`, `DonationProvider` types; `validateDonationPayload` with
  `amountCents ≥ 100` enforcement and GDPR gate (`dataProcessingAccepted === true`);
  `handleWorkerDonationRequest` (405 → 401 → 501 → 400 → 501 → 201 flow);
  `SupabaseDonationRepository` with stub `providerPaymentId` + `idempotencyKey` via
  `crypto.randomUUID()`; `donationRepository` wired into `WorkerRequestDependencies`.
  13 tests (9 integration + 3 repository + 1 config contract update).

## Files Changed

**MOBILE-ADOPTION-LIST-001:**
- `apps/mobile/src/adoption-list.ts` — new
- `apps/mobile/src/foundation.ts` — added `adoptionList` entry
- `tests/mobile/adoption-list-ui.test.ts` — new (8 tests)
- `docs/work-items/MOBILE-ADOPTION-LIST-001-*.md` — new

**DONATION-WORKER-001:**
- `packages/config/src/env.ts` — added `WORKER_DONATIONS_PATH`
- `apps/workers/src/donation.ts` — new
- `apps/workers/src/donation-supabase.ts` — new
- `apps/workers/src/dependencies.ts` — added `donationRepository`
- `apps/workers/src/index.ts` — route + exports
- `tests/workers/donation.test.ts` — new (9 tests)
- `tests/workers/donation-supabase-repository.test.ts` — new (3 tests)
- `tests/config/environment-contracts.test.ts` — updated for `donationsPath`
- `docs/work-items/DONATION-WORKER-001-*.md` — new

## Validation

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run test` — 429/429 passed
- `npm run build` — passed

## Current State

The Worker has:
- All prior routes (media, pets, shelters, adoptions, adoption list)
- `POST /donations` — authenticated donation intent, status `created`,
  payment state always driven by server-side webhook (never client claims)

`@pic4paws/client` does NOT yet have `createDonationClient`.
Web and Mobile do NOT yet have donation product boundaries.

## Recommended Next Work Item

`DONATION-CLIENT-001` — `createDonationClient` in `@pic4paws/client`.

- Function: `submitDonation(shelterId, input)` → `DonationClientResult`
- URL: `POST {workerBaseUrl}/donations` (uses `WORKER_DONATIONS_PATH` default `/donations`)
- Requires `getAccessToken` → Bearer auth
- Failure statuses mirror adoption client pattern: `unauthenticated`, `forbidden`,
  `invalid_donation`, `donation_repository_not_configured`, `worker_request_failed`,
  `worker_response_invalid`
- Credential sanitization in all failure reasons
- Input type: `DonationClientInput` (shelterId, amountCents, kind, paymentMethod, etc.)
- Success type: `DonationClientSuccess` with `donationId`, `amountCents`, `currency`, `kind`
