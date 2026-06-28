---
id: PAYMENT-WEBHOOK-COMPOSITION-001
title: Make provider webhook verifier selection deterministic
status: in_progress
---

# Work-Item: PAYMENT-WEBHOOK-COMPOSITION-001 - Provider-Deterministic Verifiers

## Context & Problem

Finding P1-4 in `docs/audits/2026-06-28-sdd-audit-prs-270-282.md` found that production
composition injects a global `paymentWebhookVerifier` when
`PAYMENT_PRIMARY_PROVIDER=ifthenpay`. Both provider-specific webhook routes prefer that
shared dependency over their own verifier. A valid Eupago callback is therefore parsed as
Ifthenpay and rejected whenever the deployment's global primary provider is Ifthenpay.

This contradicts the provider-isolation contract introduced by `EUPAGO-WEBHOOK-001`: the
route path, not a global deployment preference, must determine callback verification.

## Goal

Make `/webhooks/payments/ifthenpay` always use the Ifthenpay verifier and
`/webhooks/payments/eupago` always use the Eupago verifier, independently of
`PAYMENT_PRIMARY_PROVIDER`.

## States

- `provider_route_selected`: the provider is determined from the matched route.
- `provider_verified`: the route invokes only its own verifier.
- Existing disabled, invalid-signature, accepted, idempotent and processing-failure states
  remain unchanged.

## Contract

- Remove `paymentWebhookVerifier` from `WorkerRequestDependencies`.
- Remove production injection based on `PAYMENT_PRIMARY_PROVIDER`.
- The Ifthenpay route must call `createIfthenpayWebhookVerifier()` directly.
- The Eupago route must call `createEupagoVerifier()` directly.
- Repository, notification and clock dependencies remain injectable.
- `PAYMENT_PRIMARY_PROVIDER` may continue to configure outbound payment behavior, but it
  must not participate in inbound webhook verifier selection.

## Acceptance Criteria

- [x] A valid Eupago callback succeeds with primary provider `eupago` and `ifthenpay`.
- [x] A valid Ifthenpay callback succeeds with primary provider `ifthenpay` and `eupago`.
- [x] No provider-specific webhook route reads a shared verifier dependency.
- [x] Production composition no longer creates or injects a global webhook verifier.
- [x] Existing method, disabled, invalid-signature and legacy-route behavior remains green.
- [x] Focused composition tests pass.
- [x] `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` pass.
- [x] `graphify update .` is executed.

## Non-Goals

- Do not change the Eupago payload/signature protocol; that belongs to P1-2.
- Do not change per-shelter secret resolution.
- Do not change outbound payment-reference provider selection.
- Do not change webhook status mappings.

## Affected Files

- `docs/work-items/PAYMENT-WEBHOOK-COMPOSITION-001-provider-deterministic-verifiers.md`
- `apps/workers/src/index.ts`
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/routes/webhooks.ts`
- `tests/workers/eupago-webhook-composition.test.ts`
- `tests/workers/worker-ifthenpay-composition.test.ts`

## Completion Notes

- Removed the shared `paymentWebhookVerifier` field from `WorkerRequestDependencies` and
  dependency resolution.
- Removed `PAYMENT_PRIMARY_PROVIDER`-driven verifier construction from the production fetch
  composition. The setting remains available for outbound payment behavior.
- Bound each provider-specific route directly to its own verifier factory.
- Added the two cross-provider composition cases. Together with the existing cases, the matrix
  proves both valid webhook routes under both primary-provider values.
- Focused validation passed: 3 files and 17 tests. Full validation passed: typecheck, lint,
  280 test files with 2524 tests, and 9 build tasks.
- `graphify update .` completed with 8681 nodes and 11684 edges. `graphify-out/` is ignored;
  Graphify reported 71 existing extraction warnings.
