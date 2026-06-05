# Work-Spec: Implementation Plan for PAY-001

## 1. Target Files

- `docs/work-items/PAY-001-donation-transaction-and-webhook-idempotency.md`
- `docs/work-specs/PAY-001-donation-transaction-and-webhook-idempotency.md`
- `packages/payments/src/donations.ts`
- `packages/payments/src/webhooks.ts`
- `packages/payments/src/index.ts`
- `tests/payments/donation-transactions.test.ts`

## 2. Proposed Technical Approach

Add pure payment contract functions in `packages/payments`:

- `createDonationTransaction`
- `applyVerifiedPaymentWebhookEvent`

The code should model PSP-independent donation and webhook concepts aligned with the SDD. It should not verify cryptographic signatures yet; instead it should require callers to pass a `verified: true` flag so future provider adapters can sit in front of the transition logic.

## 3. Testing Strategy

- Initial failing test: assert donation intent validation, initial transaction state, verified webhook transitions and duplicate provider event idempotency.
- Expected input data: in-memory donation intent and webhook event records.
- Expected output/behavior: invalid payment inputs are rejected, valid transactions are created safely, and webhook transitions happen only once per provider event ID.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Deny unverified webhook events by default.
- Never allow client input to mark a donation as `paid`.
- Keep all monetary values as integer cents.
- Keep raw provider event IDs available for audit and idempotency.

