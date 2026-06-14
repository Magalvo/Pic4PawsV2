# Work-Item: PAYMENT-WEBHOOK-002-Auditable Payment Webhook Transition

## Goal

Payment webhook processing must update donation financial state through a single auditable server-side transition. The transition must preserve idempotency, avoid client claims, keep PSP event IDs attached to the donation, and never write non-timestamps into audit timestamp columns.

## States

- `provider_adapter_not_configured`: no verifier is available.
- `webhook_signature_invalid`: verifier rejects the raw body/signature.
- `payment_webhook_repository_not_configured`: no repository is available.
- `webhook_already_processed`: provider event was already processed and no donation transition is repeated.
- `webhook_accepted`: provider event was recorded and, when a matching donation exists, its financial state was updated.
- `webhook_processing_failed`: repository/RPC transition failed without leaking provider secrets.

## Contract

- Replace split `recordWebhookEvent` + `updateDonationStatus` repository calls with one `processVerifiedWebhookEvent(input)` operation.
- Input includes provider, provider event ID, provider payment ID, new status, payload, and received timestamp.
- Result includes idempotency state, donation-found state, previous/new status, processed timestamp, financial timestamp, and raw provider event IDs.
- Supabase implementation must call a server-side RPC for the transition rather than directly updating `donation_transactions`.
- The transition must set `updated_at` to the received timestamp, set `paid_at` for `paid`, set `refunded_at` for `refunded`, append the PSP event ID to `raw_provider_event_ids`, and mark the webhook event as processed.

## Affected files

- `apps/workers/src/payment-webhook.ts`
- `apps/workers/src/payment-webhook-supabase.ts`
- `apps/workers/src/index.ts`
- `packages/database/src/rpc-functions.ts`
- `tests/workers/payment-webhook.test.ts`
- `tests/workers/payment-webhook-supabase-repository.test.ts`
- `tests/database/rpc-functions.test.ts`

