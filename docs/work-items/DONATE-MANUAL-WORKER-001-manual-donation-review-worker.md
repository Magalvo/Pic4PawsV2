# Work-Item: DONATE-MANUAL-WORKER-001 — Manual Donation Review Worker

status: done

## 1. Context & Problem

`DONATE-TIER-WORKER-001` (merged) creates manual-tier donations with `status: 'pending_receipt'`
and returns IBAN/phone to the donor. The state machine has no handlers yet for:

1. The donor linking a receipt image to prove the bank transfer was made.
2. A shelter volunteer approving or rejecting the receipt.

Without these two endpoints the manual donation tier is a dead end — donations accumulate
in `pending_receipt` with no path to `paid` or `rejected`.

## Goal

Add two authenticated PATCH routes to the donations path:
- `PATCH /donations/:id/receipt` — donor links a receipt media asset; transitions
  `pending_receipt` → `pending_review`.
- `PATCH /donations/:id/review` — shelter member approves or rejects; transitions
  `pending_review` → `paid` (approved) or `rejected` (rejected).

Payment state transitions are always server-driven. The donor cannot approve; the shelter
member cannot forge a `paid` transition without going through the review endpoint.

## States

- `unauthenticated`: no valid Bearer actor.
- `forbidden`: actor does not have the required role for the action.
- `donation_not_found`: donation does not exist or does not belong to this actor.
- `donation_wrong_state`: donation is not in the expected status for this action.
- `receipt_media_not_found`: the provided `receiptMediaId` does not exist.
- `receipt_submitted`: PATCH /receipt succeeded; donation is now `pending_review`.
- `donation_approved`: PATCH /review with `decision: 'approved'`; donation is now `paid`.
- `donation_rejected`: PATCH /review with `decision: 'rejected'`; donation is now `rejected`.

## Acceptance Criteria

### PATCH /donations/:id/receipt

- [x] Create `apps/workers/src/donation-manual.ts` with:
  - `SubmitReceiptInput`, `ReviewDonationInput` types.
  - `validateReceiptPayload(payload)` — requires non-empty `receiptMediaId` string.
  - `validateReviewPayload(payload)` — requires `decision: 'approved' | 'rejected'`.
  - `handleSubmitReceiptRequest({ request, donationId, payload, repository, authenticator })`:
    - PATCH only → 405.
    - Auth → 401/501.
    - Loads donation; 404 if not found.
    - 403 if `actor.id !== donation.donorUserId` (donor-only action).
    - 409 `donation_wrong_state` if `donation.status !== 'pending_receipt'`.
    - Validates payload; 400 on failure.
    - Verifies `receiptMediaId` exists in `media_assets` and is owned by the actor.
    - Updates donation: `receipt_media_id = receiptMediaId`, `status = 'pending_review'`.
    - Returns 200 `{ status: 'receipt_submitted', donationId }`.
  - `handleReviewDonationRequest({ request, donationId, payload, repository, authenticator })`:
    - PATCH only → 405.
    - Auth → 401/501.
    - Loads donation; 404 if not found.
    - 403 if actor is not a member of `donation.shelterId` (`canManageShelter`).
    - 409 `donation_wrong_state` if `donation.status !== 'pending_review'`.
    - Validates payload; 400 on failure.
    - If `decision = 'approved'`: sets `status = 'paid'`, `paid_at = now`, `reviewed_by_user_id`, `reviewed_at`.
    - If `decision = 'rejected'`: sets `status = 'rejected'`, `reviewed_by_user_id`, `reviewed_at`.
    - Fires `notifyDonationPaid` fire-and-forget for approved donations.
    - Returns 200 `{ status: 'donation_approved' | 'donation_rejected', donationId }`.
- [x] Create `apps/workers/src/donation-manual-supabase.ts` with
  `createSupabaseDonationManualRepositories`.
- [x] Add `donationManualRepository?: DonationManualRepository` to `WorkerRequestDependencies`
  in `apps/workers/src/dependencies.ts`; wire in factory functions.
- [x] Add path-matching and dispatch for the two new PATCH sub-paths in
  `apps/workers/src/routes/donations.ts`.
  - Pattern: `/donations/:id/receipt` and `/donations/:id/review`.
  - Use a path matcher helper consistent with the existing `matchWorkerDonationStatusId`.
- [x] Tests in `tests/workers/donation-manual.test.ts` use injected fakes. Cover:
  - Receipt: unauthenticated, wrong actor (not donor), wrong state, missing media, success.
  - Review (approve): unauthenticated, non-member, wrong state, success → paid + notification.
  - Review (reject): success → rejected, no notification fired.
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- Donor identity for `PATCH /receipt` is `actor.id === donation.donorUserId` — never
  derived from the request body.
- Shelter membership for `PATCH /review` uses `canManageShelter(actor, shelterId)` — never
  the raw `shelterId` from the URL without this check.
- `paid_at` and `reviewed_at` are always derived from `now` (server clock), never from the
  client payload.
- The notification (`notifyDonationPaid`) is fire-and-forget — its failure must not roll
  back the review transition.

## 4. Non-Goals

- Do not handle the automated-tier webhook path; that is `PAYMENT-WEBHOOK-WORKER-001`.
- Do not allow the donor to re-submit a receipt on a `pending_review` donation (no
  receipt replacement flow in Phase 1).
- Do not expose a `PATCH /donations/:id/cancel` endpoint (future item).

## Affected files

- `apps/workers/src/donation-manual.ts`
- `apps/workers/src/donation-manual-supabase.ts`
- `apps/workers/src/routes/donations.ts`
- `apps/workers/src/dependencies.ts`
- `tests/workers/donation-manual.test.ts`

## Completion Notes

Implemented `handleSubmitReceiptRequest` (PATCH /donations/:id/receipt) and `handleReviewDonationRequest` (PATCH /donations/:id/review) with injected `DonationManualRepository`. Donor identity check uses `actor.id === donation.donorUserId`; shelter membership check uses `canManageShelter`. `paid_at`/`reviewed_at` are always server-clock (`now`). `notifyDonationPaid` is fire-and-forget on approval — failure cannot roll back the transition. Sub-path matchers registered before `matchWorkerDonationStatusId` in the donations router. 28 tests, 2319 total, full pipeline green.
