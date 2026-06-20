---
id: IFTHENPAY-WEBHOOK-001
title: Ifthenpay payment webhook verifier
status: done
---

# Work-Item: IFTHENPAY-WEBHOOK-001 - Ifthenpay Webhook Verifier

## Goal

Implement the concrete `PaymentWebhookVerifier` for Ifthenpay callbacks using the
official public callback protocol documented on 2026-06-20: Ifthenpay sends a GET
request to the configured callback URL with query-string placeholders and an
anti-phishing `key`. Wire it into the production Worker fetch handler so
`PAYMENT_WEBHOOKS_ENABLED=true` plus `PAYMENT_PRIMARY_PROVIDER=ifthenpay` processes
verified paid callbacks rather than returning `501`.

This item only handles successful payment confirmations. Failed, cancelled or refused
states must be introduced later from official Ifthenpay API/notification evidence.

Sources:

- https://www.ifthenpay.com/docs/en/
- https://www.ifthenpay.com/docs/en/guides/callback/
- https://helpdesk.ifthenpay.com/pt-PT/support/solutions/articles/79000139402-configurar-ou-alterar-os-dados-para-callback

## States

Inherits from the existing `handleWorkerPaymentWebhookRequest` state machine:

- `payment_webhooks_disabled` (503): feature flag off.
- `webhook_signature_invalid` (401): callback anti-phishing key or payload validation failed.
- `webhook_already_processed` (200): idempotent re-delivery.
- `webhook_accepted` (200): verified, recorded, donation status updated.
- `payment_webhook_verifier_not_configured` (501): provider verification is enabled but no verifier is wired.
- `payment_webhook_repository_not_configured` (501): provider verification succeeded but persistence is not wired.

## Contract

### Transport

- The shared payment webhook path remains `WORKER_PAYMENT_WEBHOOK_PATH`, currently
  `/webhooks/payments`.
- If `PAYMENT_PRIMARY_PROVIDER=ifthenpay`, the route accepts `GET` only.
- If `PAYMENT_PRIMARY_PROVIDER=eupago` or `stripe`, the route continues to accept `POST` only.
- Wrong methods return `405 method_not_allowed` with the provider-specific `Allow` header.

### Ifthenpay callback query

The verifier reads `new URL(requestUrl).searchParams`, not the request body.

Required query parameters:

```ts
type IfthenpayPaidCallbackQuery = {
  key: string;              // anti-phishing key, compared with IFTHENPAY_WEBHOOK_SECRET
  requestId: string;        // maps to providerPaymentId
  orderId: string;          // merchant order identifier
  amount: string;           // amount string from Ifthenpay
  payment_datetime: string; // payment confirmation datetime from Ifthenpay
  entity?: string;          // Multibanco only
  reference?: string;       // Multibanco only
};
```

Rules:

- `key` is compared with `IFTHENPAY_WEBHOOK_SECRET` using a timing-safe string comparison.
- `key` must not be persisted in the raw provider payload.
- `requestId`, `orderId`, `amount` and `payment_datetime` are required.
- `entity` and `reference` are accepted only when provided together.
- A valid callback always maps to `newStatus: 'paid'`.
- `providerPaymentId = requestId`.
- `providerEventId = requestId + ':paid'`.

### Shared verifier type

`PaymentWebhookVerifier` receives `requestUrl` in addition to existing fields:

```ts
type PaymentWebhookVerifier = (params: {
  rawBody: string;
  requestUrl: string;
  signatureHeader: string | null;
  secret: string;
}) => Promise<ParsedWebhookEvent | null>;
```

Providers that still use signed POST bodies can keep using `rawBody` and
`signatureHeader`. Ifthenpay uses `requestUrl` and ignores `rawBody` and
`signatureHeader`.

## Affected Files

- `docs/work-items/IFTHENPAY-WEBHOOK-001-ifthenpay-webhook-verifier.md`
- `apps/workers/src/ifthenpay-verifier.ts`
- `apps/workers/src/payment-webhook.ts`
- `apps/workers/src/routes/webhooks.ts`
- `apps/workers/src/index.ts`
- `apps/workers/package.json`
- `package-lock.json`
- `tests/workers/ifthenpay-verifier.test.ts`
- `tests/workers/payment-webhook.test.ts`
- `tests/workers/worker-boundary.test.ts`
- `tests/workers/worker-ifthenpay-composition.test.ts`

## Completion Notes

- Replaced the preliminary JSON/HMAC verifier with the official public Ifthenpay
  callback shape: GET query parameters plus anti-phishing `key`.
- Kept `/webhooks/payments` as the shared webhook path, but made the route method
  provider-aware: Ifthenpay uses GET, Eupago and Stripe remain POST.
- Added `requestUrl` to `PaymentWebhookVerifier` so provider adapters can use either
  signed raw bodies or callback URL parameters without receiving the whole `Request`.
- Added Zod validation for the sanitized Ifthenpay query payload and ensured the
  anti-phishing key is not persisted.
- Added golden-style tests for MB WAY and Multibanco callback URLs, method-boundary
  tests, and a default Worker fetch composition test proving Ifthenpay reaches the
  Supabase webhook RPC as `provider: 'ifthenpay'`.
- Validation passed:
  - `npm.cmd test -- tests/workers/ifthenpay-verifier.test.ts tests/workers/payment-webhook.test.ts tests/workers/worker-boundary.test.ts tests/workers/worker-ifthenpay-composition.test.ts`
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run test`
  - `npm.cmd run build`
- Production caveat: enable for real traffic only after replaying a sanitized sandbox
  callback or Ifthenpay Webhook Tester callback against the deployed Worker.
