---
id: EUPAGO-REFERENCE-FACTORY-001
title: Eupago provider — payment reference factory
status: done
depends-on: EUPAGO-CONFIG-WORKER-001
pr: 280
merged: 2026-06-28
---

# Work-Item: EUPAGO-REFERENCE-FACTORY-001 — Payment Reference Factory

## 1. Context & Problem

`DONATE-TIER-WORKER-001` (merged) made `POST /donations` tier-aware: manual-tier
donations receive IBAN and MB WAY phone and are set to `pending_receipt`. The
automated-tier branch was explicitly left as a `501 not_implemented` stub for Phase 1.

This item replaces that stub with a real factory pattern so automated-tier donations
call the shelter's configured PSP (Ifthenpay or Eupago) to generate a payment reference,
return it to the donor, and set `status: 'pending_payment'`.

The factory interface is injected — Worker routes do not know which PSP they are calling.
The concrete adapters (`createIfthenpayReferenceAdapter`, `createEupagoReferenceAdapter`)
are constructed from the shelter's decrypted credentials at request time.

## Goal

Define a `PaymentReferenceFactory` interface, implement Eupago and Ifthenpay adapters,
wire the factory into `handleWorkerDonationRequest`, and replace the `501 not_implemented`
automated-tier stub with real PSP reference generation.

## States

### New donation states (automated tier)

- `donation_created`: extended — for automated tier, response now includes `provider`,
  `paymentMethod`, and a `reference` block (see Contract).
- `payment_reference_failed`: PSP API call succeeded but returned an unexpected error.
  The donation row is rolled back (or marked `failed`); donor receives 502.
- `provider_credentials_unavailable`: shelter has `active_provider` set but credentials
  cannot be decrypted or are missing. Donor receives 503.

All existing states (`unauthenticated`, `payment_config_not_found`, etc.) are unchanged.

## Contract

### `PaymentReferenceFactory` interface

```ts
type PaymentReferenceInput = {
  donationId: UUID;
  amountCents: number;
  currency: 'EUR';
  shelterId: UUID;
  orderId: string;        // idempotency key, passed to PSP
};

type PaymentReference =
  | { method: 'mb_way';     phone: string; expiresAt: ISODateTime | null }
  | { method: 'multibanco'; entity: string; reference: string; expiresAt: ISODateTime | null }
  | { method: 'bank_transfer'; iban: string };

type PaymentReferenceResult =
  | { ok: true;  reference: PaymentReference; providerPaymentId: string }
  | { ok: false; reason: 'psp_error' | 'psp_timeout' | 'invalid_response' };

type PaymentReferenceFactory = {
  createReference(input: PaymentReferenceInput): Promise<PaymentReferenceResult>;
};
```

### Eupago adapter (`createEupagoReferenceAdapter`)

Eupago reference creation uses their REST API:

- **Endpoint**: `POST https://clientes.eupago.pt/api/v1.02/multibanco/create` (Multibanco)
  or `POST https://clientes.eupago.pt/api/v1.02/mbway/create` (MB WAY).
- **Auth**: `Authorization: ApiKey <eupagoApiKey>` header.
- **Payload fields** (Multibanco example):
  ```json
  { "payment": { "amount": { "currency": "EUR", "value": 10.00 }, "identifier": "<orderId>" } }
  ```
- **Response** maps to `PaymentReference`:
  - Multibanco: `entity`, `reference`, `expiresAt` from response body.
  - MB WAY: `alias` (phone), `expiresAt`.
- Adapter reads `paymentMethod` from the shelter's `mbWayPhone` config: if configured →
  MB WAY; else → Multibanco.
- `providerPaymentId` is the Eupago `transactionId` from the response.

### Ifthenpay adapter (`createIfthenpayReferenceAdapter`)

Ifthenpay reference creation uses their MB WAY charge or Multibanco reference API.
Concrete endpoint and payload are confirmed from the official Ifthenpay developer docs
at implementation time (as was done for `IFTHENPAY-WEBHOOK-001`).

### `POST /donations` — automated-tier flow

1. Load shelter's `activeProvider` and decrypt credentials from `shelter_payment_configs`.
2. If credentials cannot be decrypted → 503 `provider_credentials_unavailable`.
3. Construct the appropriate adapter (`createEupagoReferenceAdapter` or
   `createIfthenpayReferenceAdapter`) using the decrypted API key.
4. Call `factory.createReference({ donationId, amountCents, currency, shelterId, orderId })`.
5. On `ok: false` → roll back the donation row (or set `status: 'failed'`) → 502 `payment_reference_failed`.
6. On `ok: true`:
   - Persist `providerPaymentId` to the `donation_transactions` row.
   - Set `status: 'pending_payment'`.
   - Return 201:
     ```ts
     {
       status: 'donation_created';
       donationId: UUID;
       tier: 'automated';
       provider: 'eupago' | 'ifthenpay';
       reference: PaymentReference;
     }
     ```

## Acceptance Criteria

- [ ] Create `apps/workers/src/payment-reference-factory.ts`:
  - Types: `PaymentReferenceInput`, `PaymentReference`, `PaymentReferenceResult`,
    `PaymentReferenceFactory`.
  - Export all types from the barrel `apps/workers/src/index.ts`.

- [ ] Create `apps/workers/src/eupago-reference-adapter.ts`:
  - `createEupagoReferenceAdapter({ apiKey, fetch }): PaymentReferenceFactory`.
  - HTTP calls use an injected `fetch` (no global `fetch`) so tests can stub the network.
  - Adapts Eupago HTTP response to `PaymentReferenceResult`.
  - Logs nothing; surfaces errors as `{ ok: false, reason }`.

- [ ] Create `apps/workers/src/ifthenpay-reference-adapter.ts`:
  - `createIfthenpayReferenceAdapter({ apiKey, fetch }): PaymentReferenceFactory`.
  - Same contract; concrete Ifthenpay endpoint confirmed from official docs at implementation.

- [ ] Update `handleWorkerDonationRequest` in `apps/workers/src/donation.ts`:
  - Replace `501 not_implemented` automated-tier stub with the factory dispatch above.
  - The factory is passed as an injected dependency; `handleWorkerDonationRequest` must
    not construct the adapter directly.

- [ ] Add `paymentReferenceFactory?: PaymentReferenceFactory` to `WorkerRequestDependencies`
  in `apps/workers/src/dependencies.ts`. The Supabase factory function wires it from
  the shelter's decrypted credentials at request time (not at app startup).

- [ ] Tests in `tests/workers/eupago-reference-adapter.test.ts` (new, ≥ 8 tests):
  - Multibanco reference returned when `mbWayPhone` absent.
  - MB WAY reference returned when `mbWayPhone` present.
  - PSP HTTP 4xx → `{ ok: false, reason: 'psp_error' }`.
  - PSP timeout / network error → `{ ok: false, reason: 'psp_timeout' }`.
  - Malformed PSP response → `{ ok: false, reason: 'invalid_response' }`.
  - All tests use a fake `fetch`; no real HTTP calls.

- [ ] Extend `tests/workers/donation.test.ts`:
  - Automated-tier + eupago → 201 with `reference` block in response.
  - `paymentReferenceFactory` returns `{ ok: false }` → 502 `payment_reference_failed`.
  - `provider_credentials_unavailable` when credentials missing.

- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- `eupagoApiKey` must be decrypted in the Worker at request time and never logged,
  stored in memory beyond the request scope, or returned in responses.
- The `orderId` passed to the PSP is the donation's `idempotencyKey` (already a
  `crypto.randomUUID()`), guaranteeing PSP-level idempotency.
- If the PSP call succeeds but the DB write fails, the donation row must be marked
  `status: 'failed'` rather than left as `pending_payment` with a missing `providerPaymentId`.

## 4. Non-Goals

- Do not implement webhook handling (EUPAGO-WEBHOOK-001).
- Do not implement recurring sponsorship reference generation (follow-on sponsorship item).
- Do not add a client boundary or UI (follow-on web/mobile items).
- Do not handle PSP refund or cancellation callbacks (future item).

## Affected Files

- `apps/workers/src/payment-reference-factory.ts` (new)
- `apps/workers/src/eupago-reference-adapter.ts` (new)
- `apps/workers/src/ifthenpay-reference-adapter.ts` (new)
- `apps/workers/src/donation.ts`
- `apps/workers/src/donation-supabase.ts`
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/index.ts`
- `tests/workers/eupago-reference-adapter.test.ts` (new)
- `tests/workers/donation.test.ts`
