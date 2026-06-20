---
id: IFTHENPAY-WEBHOOK-001
title: Ifthenpay payment webhook verifier
status: done
---

# Work-Item: IFTHENPAY-WEBHOOK-001 — Ifthenpay Webhook Verifier

## Goal

Implement `createIfthenpayWebhookVerifier` — the concrete `PaymentWebhookVerifier`
for the ifthenpay PSP (MB WAY + Multibanco). Wire it into the production Worker fetch
handler so `PAYMENT_WEBHOOKS_ENABLED=true` + `PAYMENT_PRIMARY_PROVIDER=ifthenpay`
actually processes verified callbacks rather than returning 501.

## States

Inherits from the existing `handleWorkerPaymentWebhookRequest` state machine:
- `payment_webhooks_disabled` (503) — feature flag off (unchanged)
- `webhook_signature_invalid` (401) — HMAC check failed
- `webhook_already_processed` (200) — idempotent re-delivery
- `webhook_accepted` (200) — verified, recorded, donation status updated
- `payment_webhook_verifier_not_configured` (501) — only when provider ≠ ifthenpay

## Contract

### Payload shape (`IfthenpayWebhookPayload`)

```ts
type IfthenpayWebhookPayload = {
  requestId: string;   // maps to providerPaymentId
  estado: string;      // "000" = paid, "020" = cancelled, others = failed
  valor: string;       // amount string e.g. "10.00" (informational only)
  dataHora: string;    // datetime string e.g. "2024-01-01 12:00:00"
  referencia?: string; // MB reference (Multibanco only)
  entidade?: string;   // entity code (Multibanco only)
};
```

### `createIfthenpayWebhookVerifier()`

```ts
// Returns a PaymentWebhookVerifier that:
// 1. Rejects if signatureHeader is null → returns null
// 2. Computes HMAC-SHA256(secret, rawBody) via Web Crypto API
// 3. Timing-safe comparison of hex digest with signatureHeader
// 4. If mismatch → returns null
// 5. Parses rawBody as IfthenpayWebhookPayload
// 6. Returns null if requestId or estado missing
// 7. Maps estado to DonationWebhookStatus:
//    "000" → "paid", "020" → "cancelled", others → "failed"
// 8. providerEventId = `${requestId}:${estado}` (unique per status transition)
// 9. providerPaymentId = requestId
```

### `PaymentWebhookVerifier` type change

Change return type from `ParsedWebhookEvent | null` to
`Promise<ParsedWebhookEvent | null>` — required for async Web Crypto HMAC.
Update `handleWorkerPaymentWebhookRequest` to `await` the verifier call.
Update existing test mocks from `mockReturnValue` to `mockResolvedValue`.

### Wiring in `apps/workers/src/index.ts`

```ts
// In the fetch handler, after parsing config:
// if config.payments.primaryProvider === 'ifthenpay'
//   inject paymentWebhookVerifier: createIfthenpayWebhookVerifier()
```

## Affected Files

- `docs/work-items/IFTHENPAY-WEBHOOK-001-ifthenpay-webhook-verifier.md` (this file)
- `apps/workers/src/ifthenpay-verifier.ts` — new verifier implementation
- `apps/workers/src/payment-webhook.ts` — make `PaymentWebhookVerifier` async
- `apps/workers/src/index.ts` — inject verifier in fetch handler
- `tests/workers/ifthenpay-verifier.test.ts` — new verifier tests
- `tests/workers/payment-webhook.test.ts` — update mocks to async
