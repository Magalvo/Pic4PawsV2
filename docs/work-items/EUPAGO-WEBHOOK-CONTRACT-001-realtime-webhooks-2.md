---
id: EUPAGO-WEBHOOK-CONTRACT-001
title: Align Eupago webhook handler to Realtime Webhooks 2.0 contract
status: done
priority: P1
pr: 292
---

## Goal

Update the Eupago webhook integration to conform to the Realtime Webhooks 2.0 API contract,
replacing the legacy flat body format and hex HMAC with the current nested body schema and
base64-encoded HMAC-SHA256 delivered via the `X-Signature` header.

## States

- pending: webhook handler uses legacy Webhooks 1.x contract (flat body, hex HMAC, `x-eupago-signature`)
- done: handler conforms to Realtime Webhooks 2.0 (nested `transactions`, base64 HMAC, `X-Signature`); all status values mapped; legacy format rejected

## Contract

### Signature (Realtime Webhooks 2.0)

- Header: `X-Signature`
- Algorithm: HMAC-SHA256 over raw request body
- Encoding: base64 (not hex)

### Request body schema

```json
{
  "transactions": {
    "transactionId": "string (min 1)",
    "value": "string (min 1)",
    "status": "Paid | Refund | Error | Cancel | Expired",
    "date": "string (min 1)",
    "method": "string (min 1)",
    "alias": "string? (MB WAY phone)",
    "entity": "string? (Multibanco entity)",
    "reference": "string? (Multibanco reference)"
  }
}
```

### Status mapping

| Eupago status | Internal status |
|--------------|----------------|
| Paid         | paid           |
| Refund       | refunded       |
| Cancel       | cancelled      |
| Error        | failed         |
| Expired      | failed         |

### `providerEventId` format

`${transactionId}:${status.toLowerCase()}`

## Affected Files

- [x] `apps/workers/src/payment-webhook.ts` — `PROVIDER_SIGNATURE_HEADERS.eupago` → `'X-Signature'`
- [x] `apps/workers/src/eupago-verifier.ts` — full rewrite: nested schema, base64 HMAC, status map
- [x] `apps/workers/src/routes/webhooks.ts` — extract `transactionId` from `body.transactions.transactionId` (was `body.transactionId`)
- [x] `tests/workers/eupago-verifier.test.ts` — full rewrite to Webhooks 2.0 format; add status-map tests
- [x] `tests/workers/eupago-webhook-composition.test.ts` — update helpers and add status-variant tests
- [x] `tests/workers/payment-webhook.test.ts` — update 2 assertions for `X-Signature`
