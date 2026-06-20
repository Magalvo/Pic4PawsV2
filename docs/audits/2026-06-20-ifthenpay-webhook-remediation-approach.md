---
source-audit: "docs/audits/2026-06-20-preliminary-audit-pr-201-ifthenpay-webhook.md"
scope: "IFTHENPAY-WEBHOOK-001 remediation approach"
date: "2026-06-20"
status: "proposed"
---

# Ifthenpay Webhook Remediation Approach

## Decision Summary

Do not production-enable the current `IFTHENPAY-WEBHOOK-001` implementation as-is.

The public Ifthenpay documentation available on 2026-06-20 describes callbacks as
HTTP GET requests with query-string placeholders and an anti-phishing key, not as
POST JSON callbacks signed with an `x-ifthenpay-signature` HMAC header. The existing
work item and verifier therefore need a protocol correction before further validation
work has value.

Primary sources checked:

- Ifthenpay API Documentation: https://www.ifthenpay.com/docs/en/
- Ifthenpay Callback and Notifications guide: https://www.ifthenpay.com/docs/en/guides/callback/
- Ifthenpay Backoffice callback configuration article: https://helpdesk.ifthenpay.com/pt-PT/support/solutions/articles/79000139402-configurar-ou-alterar-os-dados-para-callback

## Recommended Work Split

### 1. Blocker: replace the assumed protocol contract

Create a new enriched work item, or reopen `IFTHENPAY-WEBHOOK-001` if the PR is still
unmerged, with this corrected Goal / States / Contract / Affected files:

- Goal: accept documented Ifthenpay successful-payment callbacks safely.
- States:
  - `payment_webhooks_disabled`
  - `webhook_signature_invalid` or a renamed `webhook_auth_invalid`
  - `webhook_already_processed`
  - `webhook_accepted`
  - `payment_webhook_repository_not_configured`
- Contract:
  - transport is provider-specific `GET` for Ifthenpay callbacks unless private
    Ifthenpay account documentation proves otherwise;
  - auth is exact anti-phishing key comparison from query parameter `key` for
    Multibanco and MB WAY callbacks;
  - payload is parsed from query parameters, not JSON body;
  - `requestId`, `amount`, `payment_datetime` and `orderId` are required for
    MB WAY and Multibanco;
  - `entity` and `reference` are required for Multibanco only;
  - callback represents confirmed payment, so it maps to `paid`;
  - failed/cancelled states must not be invented from callback data unless Ifthenpay
    supplies a documented notification/status endpoint for those transitions.

The first failing tests should use the official example callback URLs from the
Ifthenpay guide as golden fixtures. If sandbox access provides different account-
specific behavior, store sanitized sandbox callback URLs as additional golden fixtures.

### 2. Runtime validation should follow the corrected protocol

The audit finding about weak payload validation remains valid, but the schema should
not validate the current JSON shape. Instead:

- use a small Zod schema or equivalent runtime parser for `URLSearchParams`;
- reject missing or non-string `requestId`, `orderId`, `amount`, `payment_datetime`;
- reject Multibanco callbacks missing `entity` or `reference`;
- preserve the original query payload in the raw provider event table;
- keep amount/date as audit fields now, even before reconciliation logic consumes them.

This should be implemented under the same corrected protocol work item because it
changes the verifier contract.

### 3. Worker route composition must become provider-aware

The generic Worker webhook route currently allows only POST. Ifthenpay's documented
callback is GET, so either:

- make the `/webhooks/payments` route provider-aware and allow GET only when the
  primary provider is Ifthenpay; or
- add a provider-specific route such as `/webhooks/payments/ifthenpay` with its own
  method policy.

Prefer the provider-specific route if future PSPs need incompatible transports. Prefer
the provider-aware existing route if operational simplicity matters more and the code
keeps the method matrix explicit in tests.

Add a Worker-level composition test proving:

- `PAYMENT_WEBHOOKS_ENABLED=true`;
- `PAYMENT_PRIMARY_PROVIDER=ifthenpay`;
- the Ifthenpay webhook secret is configured as the anti-phishing key;
- an official-style callback reaches `processVerifiedWebhookEvent`;
- the persisted event has `provider: "ifthenpay"`, a stable `providerPaymentId`,
  a stable `providerEventId`, `newStatus: "paid"` and the raw query payload.

### 4. Idempotency and event identity need a stable payment-confirmation model

The current `providerEventId = requestId:estado` assumes multiple status transitions.
For documented successful-payment callbacks, use a paid-confirmation identity instead,
for example:

- `ifthenpay:${requestId}:paid`, if `requestId` is guaranteed stable and unique; or
- `ifthenpay:${orderId}:${requestId}:paid`, if `orderId` is the safer merchant-side
  correlation key.

Confirm this against sandbox/account docs before implementation. Do not include amount
or timestamp in the idempotency key unless Ifthenpay can resend the same payment with
different formatting.

### 5. Completion hygiene

Before merge:

- run the required validation gates from `AGENTS.md`;
- run `graphify update .`;
- add Completion Notes to the work item recording the exact official docs, sandbox
  fixtures if used, validation commands and production caveats;
- keep production enablement gated until a real Ifthenpay callback has been replayed
  or generated through their Webhook Tester/sandbox.

## Suggested Merge Policy

Treat P1-1 as blocking. P2-1 and P2-2 should be resolved in the same remediation PR
because the official protocol changes both validation and Worker routing. P2-3 and
P3-1 are hygiene items and can be completed at the end of the same PR.
