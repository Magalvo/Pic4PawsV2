# Work-Item: PAYMENT-WEBHOOK-VERIFIER-001 - Production Payment Webhook Verifier Gate

## Goal

Prevent production payment webhook handling from silently running without a real provider verifier. Until the primary PSP verifier is implemented or injected by production composition, the endpoint must be blocked by an explicit operational feature flag and must never mutate payment state from unverified events.

## States

- `webhooks_disabled`: payment webhook processing is intentionally blocked by configuration.
- `verifier_not_configured`: webhook processing is enabled but no provider verifier is wired for the selected provider.
- `signature_invalid`: provider verifier rejected the raw event/signature.
- `accepted`: verified event was recorded and applied through the payment webhook repository.
- `already_processed`: verified provider event was already processed and no financial transition is repeated.

## Contract

- `PAYMENT_WEBHOOKS_ENABLED` is a configuration flag with default `false`.
- When `PAYMENT_WEBHOOKS_ENABLED=false`, `POST /webhooks/payments` returns `503 payment_webhooks_disabled` before verifier/repository work.
- When `PAYMENT_WEBHOOKS_ENABLED=true` and no verifier is wired, the handler returns `501 payment_webhook_verifier_not_configured`.
- The old generic `provider_adapter_not_configured` response must not be emitted by the default production worker composition.
- Payment state remains derived only from verified provider events.

## Affected files

- `packages/config/src/env.ts`
- `apps/workers/src/payment-webhook.ts`
- `apps/workers/src/routes/webhooks.ts`
- `tests/config/environment-contracts.test.ts`
- `tests/workers/payment-webhook.test.ts`
- `tests/workers/worker-boundary.test.ts`

## Completion Notes

- Added `PAYMENT_WEBHOOKS_ENABLED` with default `false` to the typed environment contract.
- Blocked `POST /webhooks/payments` with `503 payment_webhooks_disabled` while the flag is off.
- Replaced the generic missing-adapter response with `501 payment_webhook_verifier_not_configured` when processing is enabled without an injected verifier.
- Added config, handler and worker-boundary tests proving default production composition does not silently process or fall back to `provider_adapter_not_configured`.
