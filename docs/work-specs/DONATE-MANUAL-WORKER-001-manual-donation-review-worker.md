# Work-Spec: Implementation Plan for DONATE-MANUAL-WORKER-001

## 1. Target Files

- `docs/work-items/DONATE-MANUAL-WORKER-001-manual-donation-review-worker.md`
- `docs/work-specs/DONATE-MANUAL-WORKER-001-manual-donation-review-worker.md`
- `apps/workers/src/donation-manual.ts`
- `apps/workers/src/donation-manual-supabase.ts`
- `apps/workers/src/routes/donations.ts`
- `apps/workers/src/dependencies.ts`
- `tests/workers/donation-manual.test.ts`

## 2. Proposed Technical Approach

### Path matching

Two new sub-paths under the existing donations route. Add a helper alongside
`matchWorkerDonationStatusId`:

```ts
// '/donations/abc123/receipt' → { donationId: 'abc123', action: 'receipt' }
// '/donations/abc123/review'  → { donationId: 'abc123', action: 'review' }
// '/donations/abc123'         → null (handled by existing matcher)
export const matchWorkerDonationActionPath = (
  pathname: string,
  donationsPath: string,
): { donationId: string; action: 'receipt' | 'review' } | null
```

Add the dispatch for these two new actions in `routes/donations.ts` before the existing
status-id match.

### Handler module (`donation-manual.ts`)

The two handlers share the same skeleton:
1. PATCH guard.
2. Auth.
3. Load donation (via repository).
4. Actor-specific guard (donor vs shelter member).
5. Status guard.
6. Payload validation.
7. Domain write.
8. Response.

Keep each handler as a pure function that takes typed repository + authenticator — no
Supabase references.

### Repository interface (`DonationManualRepository`)

```ts
type DonationManualRepository = {
  getDonation: (donationId: string) => Promise<DonationManualRow | null>;
  mediaAssetExists: (mediaId: string, ownerUserId: string) => Promise<boolean>;
  submitReceipt: (donationId: string, receiptMediaId: string, now: string) => Promise<void>;
  approveDonation: (donationId: string, reviewerUserId: string, now: string) => Promise<void>;
  rejectDonation: (donationId: string, reviewerUserId: string, now: string) => Promise<void>;
};
```

`DonationManualRow` exposes: `id`, `status`, `donorUserId`, `shelterId`.

### Supabase adapter (`donation-manual-supabase.ts`)

- `getDonation`: SELECT `id,status,donor_user_id,shelter_id` FROM `donation_transactions`.
- `mediaAssetExists`: SELECT count FROM `media_assets WHERE id = mediaId AND owner_user_id = ownerUserId`.
- `submitReceipt`: UPDATE `donation_transactions SET receipt_media_id, status = 'pending_review', updated_at WHERE id`.
- `approveDonation`: UPDATE SET `status = 'paid', paid_at, reviewed_by_user_id, reviewed_at, updated_at`.
- `rejectDonation`: UPDATE SET `status = 'rejected', reviewed_by_user_id, reviewed_at, updated_at`.

All updates include a status pre-condition in the WHERE clause
(`AND status = 'pending_receipt'` or `AND status = 'pending_review'`) to prevent
race conditions — if the row count is 0, throw a `DonationManualRepositoryError`.

### Notification integration

After `approveDonation` succeeds, call `notificationRepository.notifyDonationPaid(...)` via
the same fire-and-forget pattern used in `payment-webhook.ts`:

```ts
if (notificationRepository) {
  notificationRepository
    .notifyDonationPaid({ providerPaymentId: donation.id, provider: 'manual' })
    .catch(() => undefined);
}
```

Note: `'manual'` is not a valid `paymentProvider` enum value in the DB. The notification
repository's `notifyDonationPaid` signature accepts any `provider` string for lookup
purposes — verify this is acceptable or add `'manual'` to the enum in the DB (if so,
create a sub-task or note it as a follow-up). Alternatively, look up the donation's
`provider` field from the loaded row and pass it. The loaded row already has `provider`
if we extend `DonationManualRow` to include it.

## 3. Testing Strategy

`tests/workers/donation-manual.test.ts` — all fake.

`PATCH /receipt` cases (write before implementation):
- No auth → 401.
- Donation not found → 404.
- Actor is not the donor → 403.
- Donation in wrong state (`pending_review`) → 409.
- `receiptMediaId` missing → 400.
- Media not found for this user → 404 `receipt_media_not_found`.
- Happy path → 200 `receipt_submitted`.

`PATCH /review` cases:
- No auth → 401.
- Actor not a shelter member → 403.
- Donation in wrong state (`pending_receipt`) → 409.
- Invalid decision → 400.
- Approve → 200 `donation_approved`; notification fired.
- Reject → 200 `donation_rejected`; notification NOT fired.

## 4. Validation Commands

```
npx tsc --noEmit -p tests/tsconfig.json
npm run typecheck
npm run lint
npm run test
npm run build
```

## 5. Risk Controls

- Status pre-condition in WHERE clause for all update queries prevents concurrent
  double-approval.
- Notification failure must never surface to the HTTP response (fire-and-forget `.catch`).
- `paid_at` and `reviewed_at` are always the server's `now` timestamp — never from
  the client payload.
