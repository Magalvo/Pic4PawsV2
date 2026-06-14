# Work-Item: DONATION-WORKER-001 — Donation Worker Route

status: done

## 1. Context & Problem

The `donationTransactions` table is defined in `packages/database/src/schema.ts`.
No Worker route exists to accept donation intent requests.

Donors must be able to initiate a donation to a shelter (optionally linked to a pet).
Payment state is always driven by server-side webhook confirmation — the client only
initiates the intent.

## Goal

Expose an authenticated donation-intent Worker route that creates server-owned donation transactions while keeping paid, failed and refunded state exclusively under verified webhook/API control.

## States

- `unauthenticated`: no valid Bearer actor is available.
- `invalid_donation`: request payload validation failed.
- `repository_not_configured`: donation persistence is not wired.
- `donation_created`: a server-side donation transaction was inserted with non-final payment state.

## 2. Acceptance Criteria

- [ ] Add `WORKER_DONATIONS_PATH` to `packages/config/src/env.ts` (default `/donations`);
  rebuild config.
- [ ] Add `apps/workers/src/donation.ts` with:
  - `DonationKind`, `DonationPaymentMethod`, `DonationProvider` types.
  - `CreateDonationInput`, `CreateDonationResult`, `DonationRepository` types.
  - `validateDonationPayload` — validates `shelterId`, `amountCents` (integer ≥ 100),
    `kind`, `paymentMethod`, `dataProcessingAccepted === true`, optional nullable fields.
  - `handleWorkerDonationRequest({ request, payload, donationRepository, authenticator, provider, now })`:
    - `POST` only → 405 otherwise.
    - Requires authentication (401 / 501).
    - Validates payload → 400 with `invalid_donation` + `reasons` array.
    - Repository guard → 501 `donation_repository_not_configured`.
    - On success → 201 `{ status: 'donation_created', donationId, amountCents, currency, kind, shelterId, createdAt }`.
- [ ] Add `apps/workers/src/donation-supabase.ts` with `createSupabaseDonationRepositories`.
  - Inserts into `donation_transactions` with `status: 'created'`.
  - Generates `providerPaymentId` and `idempotencyKey` via injected/default `generateId`.
- [ ] Add `donationRepository?: DonationRepository` to `WorkerRequestDependencies`
  in `apps/workers/src/dependencies.ts`; wire into both factory functions.
- [ ] Wire route in `apps/workers/src/index.ts`; export all new types/functions.
- [ ] Tests use injected fakes — no real network/DB calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Response body never contains credential markers.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- Payment state (paid, failed, refunded) is ALWAYS driven by the payment webhook,
  never by this `POST /donations` route.
- `donorUserId` is always derived from the authenticated `actor.id`, never from the
  client request body.

## 4. Non-Goals

- Do not integrate a real payment provider (EuPago, Stripe, etc.).
- Do not implement `DONATION-CLIENT-001` (client package) or Web/Mobile boundaries.

## Affected files

- `packages/config/src/env.ts`
- `apps/workers/src/donation.ts`
- `apps/workers/src/donation-supabase.ts`
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/index.ts`
- `tests/workers/donation.test.ts`
- `tests/workers/donation-supabase-repository.test.ts`

## 5. Completion Notes

- Added typed donation payload validation and authenticated Worker handling.
- Added Supabase donation repository wiring for server-side transaction creation.
- Ensured `donorUserId` is derived from the authenticated actor.
- Kept final payment state outside the client-created donation intent route.
