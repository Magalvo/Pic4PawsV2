# Checkpoint: Donation Status Slice Complete

Date: 2026-06-08
Last merged: `agent/MOBILE-DONATION-LIST-001` (PR #54) → full donation status slice in PRs #55–#59

## Summary

Completed the full payment confirmation + donor status polling slice:
- Payment webhook handler (server-to-server, Worker only)
- Donation status Worker route + client + Web + Mobile product boundaries

The donor can now poll their donation status and payment confirmation flows through the Worker.

## Items Merged In This Session

- **PAYMENT-WEBHOOK-WORKER-001** (PR #55) — `POST /webhooks/payments` payment webhook handler.
  `PaymentWebhookVerifier` interface: `({ rawBody, signatureHeader, secret }) => ParsedWebhookEvent | null`.
  `PaymentWebhookRepository`: idempotency check (`payment_webhook_events`), record event, update
  `donation_transactions` status. `PROVIDER_SIGNATURE_HEADERS` map (eupago/ifthenpay/stripe).
  Handler reads `request.text()` for raw-body HMAC verification. 501 → 401 → 501 → 200 flow.
  Supabase impl in `payment-webhook-supabase.ts`. No client/UI boundary. 6 tests.

- **DONATION-STATUS-WORKER-001** (PR #56) — `GET /donations/:donationId` Worker route.
  Donor-only access: `actor.id !== record.donorUserId → 403`. `donorUserId` loaded from DB,
  omitted from 200 response via destructuring. `matchWorkerDonationStatusId` path matcher
  (single-segment, rejects sub-paths). `DonationStatusRepository.getDonationStatus`.
  `DonationStatusRecord` type. Supabase impl in `donation-status-supabase.ts`. 9 tests.

- **DONATION-STATUS-CLIENT-001** (PR #57) — `createDonationStatusClient` in `@pic4paws/client`.
  `loadDonationStatus(donationId)` → `DonationStatusClientResult`. Bearer auth,
  `createWorkerSubUrl(workerBaseUrl, donationsPath, donationId)`. `DonationStatusClientItem`
  reuses `DonationClientKind`/`DonationClientStatus`/`DonationClientPaymentMethod`.
  `DonationStatusClientFailureStatus` includes `donation_not_found`. `sanitizeReasons`. 10 tests.

- **WEB-DONATION-STATUS-001** (PR #58) — Web donation status product boundary.
  `createWebDonationStatusUi({ donationStatusClient })` with `getInitialState` + `loadDonationStatus`.
  6 states: idle, loading, loaded (donation: DonationStatusClientItem), not_found (dedicated),
  forbidden (dedicated, not failed), failed (canRetry: true). `webDonationStatusUiContent`
  (pt-PT, product-flow-ready). `webFoundationContent.donationStatus` entry. 10 tests.

- **MOBILE-DONATION-STATUS-001** (PR #59) — Mobile donation status product boundary. Mirrors
  WEB-DONATION-STATUS-001 with `Mobile`-prefixed types. `mobileDonationStatusUiContent`
  (pt-PT, product-flow-ready). `mobileFoundationContent.donationStatus` entry. 9 tests.

## Files Changed

**PAYMENT-WEBHOOK-WORKER-001:**
- `apps/workers/src/payment-webhook.ts` — new
- `apps/workers/src/payment-webhook-supabase.ts` — new
- `apps/workers/src/dependencies.ts` — added `paymentWebhookVerifier?`, `paymentWebhookRepository?`
- `apps/workers/src/index.ts` — replaced 501 stub with real handler + barrel exports
- `tests/workers/payment-webhook.test.ts` — new (6 tests)
- `docs/work-items/PAYMENT-WEBHOOK-WORKER-001-payment-webhook-worker-route.md` — new

**DONATION-STATUS-WORKER-001:**
- `apps/workers/src/donation-status.ts` — new
- `apps/workers/src/donation-status-supabase.ts` — new
- `apps/workers/src/dependencies.ts` — added `donationStatusRepository?`
- `apps/workers/src/index.ts` — added route block + barrel exports
- `tests/workers/donation-status.test.ts` — new (9 tests)
- `docs/work-items/DONATION-STATUS-WORKER-001-donation-status-worker-route.md` — new

**DONATION-STATUS-CLIENT-001:**
- `packages/client/src/index.ts` — appended donation status client section
- `tests/client/donation-status-client.test.ts` — new (10 tests)
- `docs/work-items/DONATION-STATUS-CLIENT-001-donation-status-client.md` — new

**WEB-DONATION-STATUS-001:**
- `apps/web/src/donation-status.ts` — new
- `apps/web/src/foundation.ts` — added `donationStatus` entry
- `tests/web/donation-status-ui.test.ts` — new (10 tests)
- `docs/work-items/WEB-DONATION-STATUS-001-web-donation-status-ui.md` — new

**MOBILE-DONATION-STATUS-001:**
- `apps/mobile/src/donation-status.ts` — new
- `apps/mobile/src/foundation.ts` — added `donationStatus` entry
- `tests/mobile/donation-status-ui.test.ts` — new (9 tests)
- `docs/work-items/MOBILE-DONATION-STATUS-001-mobile-donation-status-ui.md` — new

## Validation (at MOBILE-DONATION-STATUS-001)

- `npm run typecheck` — passed (15/15)
- `npm run lint` — passed (8/8)
- `npm run test` — 567/567 passed (87 test files)
- `npm run build` — passed (9/9)

## Current State

The full donation payment confirmation slice is wired end-to-end:
- Worker: `POST /webhooks/payments` — verified HMAC, idempotent event recording, status update
- Worker: `GET /donations/:donationId` — donor-only access, `donorUserId` never leaked
- Client: `createDonationStatusClient` — `loadDonationStatus(donationId)` with auth
- Web: `createWebDonationStatusUi` — 6 states (not_found + forbidden as dedicated), PT-PT
- Mobile: `createMobileDonationStatusUi` — same pattern, Mobile prefix

Payment state is always driven by verified server-side webhook (`PaymentWebhookVerifier`).
The `paymentWebhookVerifier` is intentionally left unset by the factory — provider-specific
HMAC adapters must be wired per deployment.

## Recommended Next Work Item

**SPONSORSHIP-WORKER-001** — Recurring sponsorship (padrinhos) Worker route.

Design sketch:
- `POST /sponsorships` — create sponsorship intent (similar to `POST /donations`):
  - Authenticated, donor ID from actor (never from client)
  - `shelterId`, `petId?` in request body (petId optional — shelter-level sponsorship possible)
  - `amountCents ≥ 100`, `currency`, `paymentMethod`, GDPR consent gate
  - `recurringInterval`: `monthly | quarterly | annual`
  - `sponsorships` table (id, donorUserId, shelterId, petId?, amountCents, currency,
    paymentMethod, recurringInterval, status, createdAt, cancelledAt?)
  - Returns `{ status: 'ok', sponsorshipId, providerPaymentId }`
- Worker route, Supabase repository, dependencies wiring — no client/UI in this item

After SPONSORSHIP-WORKER-001:
- `SPONSORSHIP-CLIENT-001` — `createSponsorshipClient` in `@pic4paws/client`
- `WEB-SPONSORSHIP-001` / `MOBILE-SPONSORSHIP-001` — product boundaries
- `SPONSORSHIP-LIST-WORKER-001` — `GET /shelters/:shelterId/sponsorships` for shelter-side view
