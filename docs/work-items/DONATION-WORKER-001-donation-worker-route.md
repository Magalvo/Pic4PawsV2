# Work-Item: DONATION-WORKER-001 — Donation Worker Route

## 1. Context & Problem

The `donationTransactions` table is defined in `packages/database/src/schema.ts`.
No Worker route exists to accept donation intent requests.

Donors must be able to initiate a donation to a shelter (optionally linked to a pet).
Payment state is always driven by server-side webhook confirmation — the client only
initiates the intent.

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

## 5. Completion Notes

_To be filled in after implementation._
