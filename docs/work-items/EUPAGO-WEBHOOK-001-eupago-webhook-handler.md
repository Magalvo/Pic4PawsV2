---
id: EUPAGO-WEBHOOK-001
title: Eupago provider — isolated webhook endpoints
status: done
depends-on: EUPAGO-DB-001
pr: 279
merged: 2026-06-28
---

# Work-Item: EUPAGO-WEBHOOK-001 — Isolated Provider Webhook Endpoints

## 1. Context & Problem

`IFTHENPAY-WEBHOOK-001` (merged) routes the single path `GET /webhooks/payments` to
the Ifthenpay verifier when `PAYMENT_PRIMARY_PROVIDER=ifthenpay`. This design assumes
one active provider globally and cannot support both Ifthenpay and Eupago simultaneously.

Eupago callbacks are `POST` with an `x-eupago-signature` HMAC-SHA256 header — a protocol
incompatible with Ifthenpay's `GET` + anti-phishing key approach. Both providers must be
able to send callbacks concurrently for different shelters.

The solution is to split the webhook path into two isolated, provider-specific routes:

- `GET  /webhooks/payments/ifthenpay` — Ifthenpay anti-phishing key + query params.
- `POST /webhooks/payments/eupago`    — Eupago HMAC-SHA256 signed JSON body.

The legacy `POST /webhooks/payments` path is deprecated and returns `410 Gone` once
both new paths are live.

## Goal

Add two isolated webhook routes; implement the Eupago verifier; migrate Ifthenpay
handling from the legacy path to its new dedicated path; deprecate the legacy path.

## States

Both new routes share the same state machine as `PAYMENT-WEBHOOK-WORKER-001`:

- `payment_webhooks_disabled` (503): global feature flag off.
- `webhook_signature_invalid` (401): anti-phishing key mismatch (Ifthenpay) or
  HMAC verification failed (Eupago).
- `webhook_already_processed` (200): idempotent re-delivery.
- `webhook_accepted` (200): verified, persisted, donation status updated.
- `payment_webhook_verifier_not_configured` (501): provider path hit but no verifier wired.
- `payment_webhook_repository_not_configured` (501): verifier passed but no repository wired.

Legacy path:
- `gone` (410): `GET/POST /webhooks/payments` — provider must update its callback URL.

## Contract

### Ifthenpay route

- **Path**: `GET /webhooks/payments/ifthenpay`
- **Method**: GET only → 405 for POST/PATCH/etc.
- **Auth**: `key` query parameter compared with the per-shelter `ifthenpay_anti_phishing_key`
  stored in `shelter_payment_configs`. The route resolves the shelter by `orderId`
  (from `requestId` param) → looks up `donation_transactions.shelter_id` →
  fetches the config row to get the expected key.
- **Verifier**: reuses existing `createIfthenpayVerifier` from `apps/workers/src/ifthenpay-verifier.ts`.
  No changes to the verifier logic; the anti-phishing key is now fetched per-shelter
  instead of from the global `IFTHENPAY_WEBHOOK_SECRET` env var.
- **Query params**: unchanged from `IFTHENPAY-WEBHOOK-001` contract
  (`key`, `requestId`, `orderId`, `amount`, `payment_datetime`; `entity`+`reference`
  for Multibanco).

### Eupago route

- **Path**: `POST /webhooks/payments/eupago`
- **Method**: POST only → 405 for GET/PATCH/etc.
- **Auth**: HMAC-SHA256 of raw request body, compared with `eupago_webhook_secret_encrypted`
  from `shelter_payment_configs`. The shelter is resolved by `transactionId` from the
  body → `donation_transactions.shelter_id` → config row.
- **Header**: `x-eupago-signature: <hex-encoded HMAC-SHA256>`.
- **Body** (confirmed from Eupago webhook documentation at implementation time):
  ```ts
  type EupagoWebhookPayload = {
    transactionId: string;   // providerPaymentId
    value: string;           // amount string
    status: 'Success' | string;
    date: string;
    method: 'MBW' | 'MB' | string;
    // MB WAY specific
    alias?: string;
    // Multibanco specific
    entity?: string;
    reference?: string;
  };
  ```
- **Status mapping**: `status = 'Success'` → `newStatus: 'paid'`. Other statuses are
  logged and ignored (not mapped) until Eupago documentation confirms their semantics.
- `providerPaymentId = transactionId`.
- `providerEventId = transactionId + ':paid'`.
- The anti-phishing key / raw body must not be persisted in the webhook event log.

### Legacy path deprecation

- `GET  /webhooks/payments` → 410 `{ status: 'gone', message: 'Use GET /webhooks/payments/ifthenpay' }`.
- `POST /webhooks/payments` → 410 `{ status: 'gone', message: 'Use POST /webhooks/payments/eupago' }`.
- Both legacy entries are removed from `apps/workers/src/routes/webhooks.ts` and replaced
  with the new routes. The `PAYMENT_PRIMARY_PROVIDER` config key is no longer read by the
  webhook router.

## Acceptance Criteria

- [ ] Create `apps/workers/src/eupago-verifier.ts`:
  - `createEupagoVerifier(): PaymentWebhookVerifier`.
  - Reads `x-eupago-signature` from `signatureHeader` (passed by webhook router).
  - Computes `HMAC-SHA256(rawBody, eupagoWebhookSecret)` using the Web Crypto API
    (`crypto.subtle.importKey` + `crypto.subtle.sign`).
  - Returns `null` if signature mismatches or required fields are absent.
  - Does NOT persist the anti-phishing key or signature value.

- [ ] Create `apps/workers/src/eupago-webhook-supabase.ts`:
  - `getEupagoWebhookSecret(shelterId): Promise<string | null>` — decrypts and returns
    `eupago_webhook_secret_encrypted` for the given shelter.

- [ ] Update `apps/workers/src/routes/webhooks.ts`:
  - Remove `GET /webhooks/payments` and `POST /webhooks/payments` handlers.
  - Add `GET /webhooks/payments/ifthenpay` → `handleWorkerPaymentWebhookRequest` with
    per-shelter anti-phishing key resolution.
  - Add `POST /webhooks/payments/eupago` → `handleWorkerPaymentWebhookRequest` with
    per-shelter Eupago secret resolution and `createEupagoVerifier()`.
  - Add `GET|POST /webhooks/payments` (catch-all before) → 410 `gone`.
  - Update `matchWorkerWebhookPath` or introduce `matchWorkerIfthenpayWebhookPath` and
    `matchWorkerEupagoWebhookPath` for correct path dispatch.

- [ ] Update `apps/workers/src/routes/webhooks.ts` route registration order:
  ```
  1. /webhooks/payments/ifthenpay  (GET)
  2. /webhooks/payments/eupago     (POST)
  3. /webhooks/payments            (GET|POST → 410)
  ```

- [ ] Update `tests/workers/route-table.test.ts` to assert the new ordering.

- [ ] Tests in `tests/workers/eupago-verifier.test.ts` (new, ≥ 8 tests):
  - Valid HMAC → parsed `ParsedWebhookEvent` with `newStatus: 'paid'`.
  - Tampered body → `null`.
  - Wrong secret → `null`.
  - Missing `x-eupago-signature` → `null`.
  - Missing required body fields → `null`.
  - Non-`'Success'` status → `null` (not mapped until confirmed).
  - MB WAY and Multibanco variants both parse correctly.

- [ ] Tests in `tests/workers/eupago-webhook-composition.test.ts` (new, ≥ 5 tests):
  - Valid Eupago callback → 200 `webhook_accepted`.
  - Invalid signature → 401.
  - Legacy `POST /webhooks/payments` → 410 `gone`.
  - Legacy `GET /webhooks/payments` → 410 `gone`.
  - Eupago route rejects GET → 405.

- [ ] Extend `tests/workers/worker-ifthenpay-composition.test.ts`:
  - Ifthenpay callbacks now sent to `GET /webhooks/payments/ifthenpay` (update URL).
  - Old `GET /webhooks/payments` URL → assert 410.

- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- Per-shelter secret resolution means the webhook handler must look up the shelter from
  the `providerPaymentId`/`transactionId` **before** signature verification if the secret
  is per-shelter. To avoid a timing oracle, shelter lookup failures must return
  `401 webhook_signature_invalid` (same as bad sig), not a 404 or 500.
- The Eupago HMAC must use `crypto.subtle` (constant-time) — do not use string comparison.
- `eupago_webhook_secret_encrypted` must be decrypted at request time using
  `decryptCredential` from `EUPAGO-CONFIG-WORKER-001` (`apps/workers/src/crypto.ts`).

## 4. Non-Goals

- Do not implement Eupago refund or cancellation webhook handling.
- Do not implement subscription/sponsorship webhook handling (follow-on item).
- Do not add a client or UI boundary — server-to-server only.
- Do not remove the `PAYMENT_WEBHOOKS_ENABLED` feature flag; it still gates both new paths.

## Affected Files

- `apps/workers/src/eupago-verifier.ts` (new)
- `apps/workers/src/eupago-webhook-supabase.ts` (new)
- `apps/workers/src/routes/webhooks.ts`
- `apps/workers/src/ifthenpay-verifier.ts` (per-shelter key resolution)
- `apps/workers/src/payment-webhook.ts` (minor: per-shelter secret param)
- `apps/workers/src/index.ts`
- `tests/workers/eupago-verifier.test.ts` (new)
- `tests/workers/eupago-webhook-composition.test.ts` (new)
- `tests/workers/worker-ifthenpay-composition.test.ts` (update URLs)
- `tests/workers/route-table.test.ts`
