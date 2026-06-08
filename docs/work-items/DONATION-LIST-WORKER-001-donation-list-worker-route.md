# Work-Item: DONATION-LIST-WORKER-001 — Shelter Donation List Worker Route

## 1. Context & Problem

`DONATION-WORKER-001` (merged) exposes `POST /donations` — shelters can now receive
donation intents. But there is no route for shelter members to view their received
donations. This item adds the authenticated read endpoint, mirroring
`ADOPTION-LIST-WORKER-001`.

## 2. Acceptance Criteria

- [ ] Create `apps/workers/src/donation-list.ts`:
  - `DonationStatus` type: `'created' | 'pending_payment' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'`
  - `DonationListSummary` type: `donationId`, `kind` (`DonationKind`), `status` (`DonationStatus`),
    `amountCents`, `currency`, `paymentMethod` (`DonationPaymentMethod`), `anonymous`,
    `donorDisplayName: string | null`, `publicMessage: string | null`, `createdAt`
  - `ListDonationsQuery`: `{ shelterId: string; limit?: number; offset?: number }`
  - `ListDonationsResult`: `{ donations: DonationListSummary[]; total: number }`
  - `DonationListRepository`: `{ listDonations: (query) => Promise<ListDonationsResult> }`
  - `matchWorkerDonationListShelterId(pathname, shelterPath)` — extracts shelterId from
    `{shelterPath}/{shelterId}/donations`; returns null for non-matching paths
  - `handleWorkerDonationListRequest({ request, shelterId, donationListRepository?, authenticator? })`:
    - 405 for non-GET
    - 401 no bearer token
    - 501 no authenticator
    - 401 actor null
    - 403 `!canManageShelter(actor, shelterId)`
    - 501 no repository
    - pagination (limit 1–100 default 20, offset ≥0 default 0)
    - 200 `{ status: 'ok', donations: [...], total }`
- [ ] Create `apps/workers/src/donation-list-supabase.ts`:
  - `SupabaseDonationListRepositoryError`
  - `createSupabaseDonationListRepositories({ client })` →
    `{ donationListRepository }` — queries `donation_transactions`, maps rows
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `donationListRepository?: DonationListRepository` to `WorkerRequestDependencies`
  - Wire into `createWorkerSupabaseDependencies` and `resolveWorkerRequestDependencies`
- [ ] Modify `apps/workers/src/index.ts`:
  - Import + call `matchWorkerDonationListShelterId` / `handleWorkerDonationListRequest`
  - Export new types/functions
- [ ] Tests in `tests/workers/donation-list.test.ts` (≥ 9) and
  `tests/workers/donation-list-supabase-repository.test.ts` (≥ 3)
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## 3. Non-Goals

- Do not implement donation client (`DONATION-LIST-CLIENT-001`).
- Do not implement webhook-driven status transitions.

## 4. Completion Notes

_To be filled in after implementation._
