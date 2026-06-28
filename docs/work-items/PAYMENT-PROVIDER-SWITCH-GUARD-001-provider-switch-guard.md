---
id: PAYMENT-PROVIDER-SWITCH-GUARD-001
title: Extend provider-switch guard to cover automated→manual tier transitions
status: done
depends-on: PAYMENT-CONFIG-RLS-001
pr: 290
merged: 2026-06-28
---

# Work-Item: PAYMENT-PROVIDER-SWITCH-GUARD-001 — Provider Switch Guard

## 1. Context & Problem

The provider-switch guard in `handleSavePaymentConfigRequest` only fires when the
incoming config is `tier: 'automated'`. This misses the `automated → manual` downgrade
path: a shelter with pending PSP payments could switch to manual tier, stranding those
payments without a provider to receive webhooks.

## Goal

Extend the guard so that any transition away from the current active provider — whether
to a different PSP or to manual tier — is blocked when pending `pending_payment`
donations exist for the shelter.

## States

No new ViewModel states. The fix is in the Worker save handler; the 409
`provider_switch_blocked` response already exists and is handled by the client.

## Acceptance Criteria

- [x] `apps/workers/src/shelter-payment-config.ts`:
  - Guard reads `currentProvider` unconditionally (not inside `if (validated.tier === 'automated')`)
  - `incomingProvider` is `validated.activeProvider` when new tier is automated, else `null`
  - Block fires when `currentProvider !== null && currentProvider !== incomingProvider && hasPending`
- [x] `tests/workers/shelter-payment-config.test.ts`:
  - New test: `automated → manual` with pending → 409 `provider_switch_blocked`
  - New test: `automated → manual` with no pending → 200, `savePaymentConfig` called
  - Existing tests still pass (automated→automated switch coverage preserved)
- [x] All four gates pass: typecheck, lint, test, build

## Affected Files

- `apps/workers/src/shelter-payment-config.ts`
- `tests/workers/shelter-payment-config.test.ts`
