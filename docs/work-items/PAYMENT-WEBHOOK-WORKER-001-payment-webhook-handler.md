# Work-Item: PAYMENT-WEBHOOK-WORKER-001 — Payment Webhook Handler

status: done

## 1. Context & Problem

`DONATION-WORKER-001` creates donation intents with `status: 'created'`. Payment state must
be driven by verified server-side webhook confirmation, never client claims. The Worker index
already routes `POST /webhooks/payments` to a stub that returns `501 provider_adapter_not_configured`.
This item replaces that stub with a real, testable handler.

## Goal

Add a Worker payment webhook boundary that reads raw provider events, delegates signature verification to an injected provider verifier and records idempotent server-side financial state changes.

## States

- `provider_adapter_not_configured`: no verifier was wired for the provider.
- `webhook_signature_invalid`: the verifier rejected the raw body/signature.
- `payment_webhook_repository_not_configured`: persistence is not wired.
- `webhook_already_processed`: the provider event id was already recorded.
- `webhook_accepted`: the verified event was recorded and applied or safely marked donation-not-found.

## 2. Acceptance Criteria

- [ ] Create `apps/workers/src/payment-webhook.ts`:
  - `ParsedWebhookEvent` type: `{ providerEventId, providerPaymentId, newStatus, payload }`.
  - `PaymentWebhookVerifier` type: `({ rawBody, signatureHeader, secret }) => ParsedWebhookEvent | null`.
    Returns `null` on invalid signature or unparseable body.
  - `PaymentWebhookRepository` interface:
    - `isEventAlreadyProcessed(providerEventId, provider)` → `Promise<boolean>`
    - `recordWebhookEvent({ providerEventId, provider, payload, receivedAt })` → `Promise<void>`
    - `updateDonationStatus({ providerPaymentId, provider, newStatus, providerEventId })` → `Promise<{ found: boolean }>`
  - `PROVIDER_SIGNATURE_HEADERS` constant mapping each `DonationProvider` to its header name:
    - `eupago` → `'x-eupago-signature'`
    - `ifthenpay` → `'x-ifthenpay-signature'`
    - `stripe` → `'stripe-signature'`
  - `handleWorkerPaymentWebhookRequest({ request, rawBody, provider, webhookSecret, paymentWebhookVerifier?, paymentWebhookRepository?, now })`:
    - 501 `provider_adapter_not_configured` — no verifier
    - 401 `webhook_signature_invalid` — verifier returns null
    - 501 `payment_webhook_repository_not_configured` — no repository
    - 200 `webhook_already_processed` — idempotency check
    - 200 `webhook_accepted` (donationFound: true/false) — happy path
- [ ] Create `apps/workers/src/payment-webhook-supabase.ts`:
  - `SupabasePaymentWebhookRepositoryError` class.
  - `createSupabasePaymentWebhookRepositories({ client })`.
  - `isEventAlreadyProcessed`: SELECT from `payment_webhook_events` WHERE `provider_event_id = ? AND provider = ?`.
  - `recordWebhookEvent`: INSERT into `payment_webhook_events`.
  - `updateDonationStatus`: UPDATE `donation_transactions` WHERE `provider_payment_id = ? AND provider = ?`
    SET `status = ?`; returns `{ found: true }` if any rows updated.
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `paymentWebhookVerifier?: PaymentWebhookVerifier` to `WorkerRequestDependencies`.
  - Add `paymentWebhookRepository?: PaymentWebhookRepository` to `WorkerRequestDependencies`.
  - Wire `paymentWebhookRepository` from `createSupabasePaymentWebhookRepositories` in the Supabase factory.
  - `paymentWebhookVerifier` is intentionally NOT set by the factory (it is provider-SDK-specific
    and must be injected in production via the `fetch` handler — left optional/undefined by default).
- [ ] Modify `apps/workers/src/index.ts`:
  - In the `paymentWebhookPath` block: replace `parseJsonBody` + stub return with
    `request.text()` + call to `handleWorkerPaymentWebhookRequest`.
  - Extract `webhookSecret` from `config.payments` based on `primaryProvider`.
  - Export `handleWorkerPaymentWebhookRequest`, `PaymentWebhookVerifier`, `PaymentWebhookRepository`,
    `ParsedWebhookEvent`, `PROVIDER_SIGNATURE_HEADERS` from the barrel.
- [ ] Tests: `tests/workers/payment-webhook.test.ts` (≥ 10 tests).
- [ ] Tests: `tests/workers/payment-webhook-supabase-repository.test.ts` (≥ 3 tests).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Affected files

- `apps/workers/src/payment-webhook.ts`
- `apps/workers/src/payment-webhook-supabase.ts`
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/index.ts`
- `tests/workers/payment-webhook.test.ts`
- `tests/workers/payment-webhook-supabase-repository.test.ts`
- `tests/workers/worker-boundary.test.ts`

## 3. Non-Goals

- Do not implement a real provider SDK adapter (EuPago/IfThenPay/Stripe) — `PaymentWebhookVerifier`
  is a pure interface; real adapters are future work.
- Do not add a client or UI boundary — this is server-to-server only.
- Do not implement donation status polling (`DONATION-STATUS-WORKER-001` is a separate item).

## 4. Completion Notes

- Created `apps/workers/src/payment-webhook.ts`: `ParsedWebhookEvent`, `PaymentWebhookVerifier`,
  `PaymentWebhookRepository`, `PROVIDER_SIGNATURE_HEADERS`, `handleWorkerPaymentWebhookRequest`.
- Created `apps/workers/src/payment-webhook-supabase.ts`: Supabase implementation.
- Updated `apps/workers/src/dependencies.ts`: added `paymentWebhookVerifier?` and
  `paymentWebhookRepository?`; factory wires repository (verifier intentionally left unset).
- Updated `apps/workers/src/index.ts`: replaced JSON-parse stub with `request.text()` +
  `handleWorkerPaymentWebhookRequest` call; added barrel exports.
- Updated `tests/workers/worker-boundary.test.ts`: updated the `invalid_json` test to
  reflect new raw-body-read behavior (any body → 501 without verifier, not 400).
- 14 tests in 2 new test files. 522/522 total.
- PR #55: https://github.com/Magalvo/Pic4PawsV2/pull/55
