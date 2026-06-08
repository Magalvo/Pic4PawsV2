# Checkpoint: Donation List Slice Complete

Date: 2026-06-08
Last merged: `agent/MOBILE-DONATION-LIST-001` (PR #54)

## Summary

Completed the full shelter-side donation list slice — Worker route + shared client +
Web + Mobile product boundaries. The shelter-side donation list is now fully wired
end-to-end at every layer.

## Items Merged In This Session

- **DONATION-LIST-WORKER-001** (PR #51) — `GET /shelters/:shelterId/donations` Worker route.
  Shelter membership auth (`canManageShelter`), pagination (`limit`/`offset`),
  `DonationListRepository.listDonations`, `matchWorkerDonationListShelterId` path matcher.
  `DonationListSummary` type: donationId, kind, status, amountCents, currency, paymentMethod,
  anonymous, donorDisplayName, publicMessage, createdAt. 10 tests.

- **DONATION-LIST-CLIENT-001** (PR #52) — `createDonationListClient` in `@pic4paws/client`.
  `loadDonations(shelterId, query?)` → `DonationListClientResult`. Bearer auth, pagination,
  network error handling, `sanitizeReasons` credential stripping. `DonationClientStatus` union.
  `DonationListApplication` type reuses `DonationClientKind`/`DonationClientPaymentMethod`.
  10 tests.

- **WEB-DONATION-LIST-001** (PR #53) — Web donation list product boundary.
  `createWebDonationListUi({ donationListClient })` with `getInitialState` + `loadDonations`.
  6 states: idle, loading, loaded (donations[], total), empty, forbidden (dedicated, not failed),
  failed (canRetry: true). `webDonationListUiContent` (pt-PT, product-flow-ready).
  `webFoundationContent.donationList` entry. 10 tests.

- **MOBILE-DONATION-LIST-001** (PR #54) — Mobile donation list product boundary. Mirrors
  WEB-DONATION-LIST-001 with `Mobile`-prefixed types. `mobileDonationListUiContent` (pt-PT,
  product-flow-ready). `mobileFoundationContent.donationList` entry. 10 tests.

## Files Changed

**DONATION-LIST-WORKER-001:**
- `apps/workers/src/donation-list.ts` — new
- `apps/workers/src/donation-list-supabase.ts` — new
- `apps/workers/src/dependencies.ts` — added `donationListRepository`
- `apps/workers/src/index.ts` — added route block
- `tests/workers/donation-list.test.ts` — new (10 tests)
- `tests/workers/donation-list-supabase-repository.test.ts` — new (3 tests)
- `docs/work-items/DONATION-LIST-WORKER-001-donation-list-worker-route.md` — new

**DONATION-LIST-CLIENT-001:**
- `packages/client/src/index.ts` — appended donation list client section
- `tests/client/donation-list-client.test.ts` — new (10 tests)
- `docs/work-items/DONATION-LIST-CLIENT-001-donation-list-client.md` — new

**WEB-DONATION-LIST-001:**
- `apps/web/src/donation-list.ts` — new
- `apps/web/src/foundation.ts` — added `donationList` entry
- `tests/web/donation-list-ui.test.ts` — new (10 tests)
- `docs/work-items/WEB-DONATION-LIST-001-web-donation-list-ui.md` — new

**MOBILE-DONATION-LIST-001:**
- `apps/mobile/src/donation-list.ts` — new
- `apps/mobile/src/foundation.ts` — added `donationList` entry
- `tests/mobile/donation-list-ui.test.ts` — new (10 tests)
- `docs/work-items/MOBILE-DONATION-LIST-001-mobile-donation-list-ui.md` — new

## Validation (at MOBILE-DONATION-LIST-001 merge)

- `npm run typecheck` — passed (15/15)
- `npm run lint` — passed (8/8)
- `npm run test` — 508/508 passed (80 test files)
- `npm run build` — passed (9/9)

## Current State

The full shelter-side donation list flow is wired:
- Worker: `GET /shelters/:shelterId/donations` — authenticated (shelter membership),
  paginated, `DonationListRepository.listDonations`
- Client: `createDonationListClient` — `loadDonations(shelterId, query?)` with auth
- Web: `createWebDonationListUi` — 6 states (idle/loading/loaded/empty/forbidden/failed), PT-PT
- Mobile: `createMobileDonationListUi` — same pattern, Mobile prefix

Payment state is always driven by server-side webhook (not yet implemented at Worker level).
The `POST /webhooks/payments` route in the Worker currently returns `501 provider_adapter_not_configured`.

## Recommended Next Work Item

**PAYMENT-WEBHOOK-WORKER-001** — Payment webhook handler.

The config already has:
- `config.workers.paymentWebhookPath` → `/webhooks/payments`
- `config.payments.primaryProvider` (eupago | ifthenpay | stripe)
- Per-provider webhook secrets: `eupagoWebhookSecret`, `ifthenpayWebhookSecret`, `stripeWebhookSecret`

The Worker index already has a routing stub (lines 307–334) that handles the 405 + returns 501.
Replace the stub body with a real call to `handleWorkerPaymentWebhookRequest`.

Design:
- `PaymentWebhookVerifier` interface: `({ rawBody, signatureHeader, secret }) => ParsedWebhookEvent | null`
- `ParsedWebhookEvent`: `{ providerEventId, providerPaymentId, newStatus, payload }`
- `PaymentWebhookRepository` interface: `isEventAlreadyProcessed`, `recordWebhookEvent`, `updateDonationStatus`
- Handler logic: 501 no verifier → 401 bad signature → 501 no repo → 200 already processed
  → record event → update donation status → 200 webhook_accepted
- Supabase repo: INSERT into `payment_webhook_events` (unique on provider+providerEventId),
  UPDATE `donation_transactions` WHERE `provider_payment_id = ? AND provider = ?`
- `PROVIDER_SIGNATURE_HEADERS` map: `eupago: 'x-eupago-signature'`, etc.
- No client/UI boundary needed — this is server-to-server

After PAYMENT-WEBHOOK-WORKER-001:
- Consider DONATION-STATUS-WORKER-001 (`GET /donations/:donationId`) for client status polling
