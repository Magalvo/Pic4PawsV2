---
id: PAY-001
title: Donation Transaction and Webhook Idempotency
status: done
---

# Work-Item: PAY-001-Donation Transaction and Webhook Idempotency

## 1. Context & Problem

The approved architecture requires payment state to be driven by verified server-side PSP webhook or API confirmation, never by client claims. `DB-001` defined donation transaction and webhook event storage, but the payments package still lacks shared contracts for donation intents, transaction transitions and webhook idempotency.

This task establishes persistence-free payment rules that can later be wired into Cloudflare Workers and Supabase writes.

## Goal

Define payment-domain contracts for donation intent creation, verified webhook transitions and provider event idempotency without trusting client payment claims.

## States

- `created`: a server-side donation transaction was created but has no PSP confirmation.
- `pending_payment`: the PSP is waiting for donor action or settlement.
- `paid`: a verified PSP event confirmed payment.
- `failed`: a verified PSP event confirmed payment failure.
- `cancelled`: a verified PSP event cancelled the payment.
- `refunded`: a verified PSP event confirmed a full refund.
- `partially_refunded`: a verified PSP event confirmed a partial refund.
- `duplicate_event`: the provider event id was already applied and must not transition again.

## 2. Acceptance Criteria

- [x] Donation intents require integer cent amounts in EUR and reject zero, negative or non-integer amounts.
- [x] Donation intents require a provider, payment method, shelter id and idempotency key.
- [x] Transaction creation starts in `created` or `pending_payment` and never in `paid` from client input.
- [x] Verified PSP webhook events can transition transactions to `paid`, `failed`, `cancelled`, `refunded` or `partially_refunded`.
- [x] Duplicate provider webhook event IDs are idempotent and do not apply state changes twice.
- [x] Unknown or unverified webhook events are rejected.
- [x] Tests fail before implementation and pass after the payment contracts are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Eupago, Ifthenpay or Stripe.
- Do not implement webhook signature verification algorithms.
- Do not persist transactions or webhook events.
- Do not implement checkout UI or API routes.

## Affected files

- `packages/payments/src/donations.ts`
- `packages/payments/src/webhooks.ts`
- `packages/payments/src/index.ts`
- `tests/payments/donations.test.ts`
- `tests/payments/webhooks.test.ts`

## 4. Completion Notes

- Added payment contract functions for safe donation transaction creation and verified webhook state transitions.
- Added idempotency protection through raw provider event IDs.
- Kept provider signature verification, persistence, API wiring and UI outside this task.
- Full validation passed with Node `22.22.3`.
