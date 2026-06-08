# Work-Item: DONATION-STATUS-WORKER-001 — Donation Status Worker Route

## 1. Context & Problem

`DONATION-WORKER-001` creates donations with `status: 'created'`. After the payment
provider redirects back or the app polls for result, the client needs a way to check
the current server-side status of a specific donation. Without this, there is no way
to surface `paid`, `failed`, etc. to the user.

## 2. Acceptance Criteria

- [ ] Create `apps/workers/src/donation-status.ts`:
  - `DonationStatusRecord` type: `{ donationId, donorUserId, shelterId, petId, kind, donationStatus, amountCents, currency, paymentMethod, createdAt }`.
  - `DonationStatusRepository` interface: `getDonationStatus(donationId) → Promise<DonationStatusRecord | null>`.
  - `matchWorkerDonationStatusId(pathname, donationsPath) → string | null`:
    matches `{donationsPath}/{donationId}` (single non-empty segment, no sub-paths).
  - `handleWorkerDonationStatusRequest({ request, donationId, donationStatusRepository?, authenticator? }) → Promise<Response>`:
    - 405 non-GET
    - 401 no bearer token
    - 501 no authenticator
    - 401 actor is null
    - 501 no repository
    - 404 donation not found
    - 403 actor is not the donor (`actor.id !== record.donorUserId`)
    - 200 `{ status: 'ok', donation: DonationStatusRecord (without donorUserId) }`
- [ ] Create `apps/workers/src/donation-status-supabase.ts`:
  - `SupabaseDonationStatusRepositoryError` class.
  - `createSupabaseDonationStatusRepositories({ client })`.
  - SELECT `id, donor_user_id, shelter_id, pet_id, kind, status, amount_cents, currency, payment_method, created_at` FROM `donation_transactions` WHERE `id = donationId` AND `deleted_at IS NULL`.
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `donationStatusRepository?: DonationStatusRepository`.
  - Wire from `createSupabaseDonationStatusRepositories` in Supabase factory.
- [ ] Modify `apps/workers/src/index.ts`:
  - Add `matchWorkerDonationStatusId` + `handleWorkerDonationStatusRequest` import.
  - Insert route block (before the exact `donationsPath` POST block):
    ```
    const donationStatusId = matchWorkerDonationStatusId(url.pathname, config.workers.donationsPath);
    if (donationStatusId !== null) { return handleWorkerDonationStatusRequest({ ... }); }
    ```
  - Barrel-export all new types and functions.
- [ ] Tests: `tests/workers/donation-status.test.ts` (≥ 10 tests, fail → pass).
- [ ] Tests: `tests/workers/donation-status-supabase-repository.test.ts` (≥ 3 tests).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No client (`@pic4paws/client`) or UI boundary in this item.
- Shelter managers accessing donation status is out of scope — they use `GET /shelters/:id/donations`.

## 4. Completion Notes

- Created `apps/workers/src/donation-status.ts`: `DonationStatusRecord`, `DonationStatusRepository`,
  `matchWorkerDonationStatusId`, `handleWorkerDonationStatusRequest` (405→401→501→401→501→404→403→200).
- Created `apps/workers/src/donation-status-supabase.ts`: Supabase impl with `deleted_at IS NULL` guard.
- Updated `apps/workers/src/dependencies.ts`: `donationStatusRepository?` wired from factory.
- Updated `apps/workers/src/index.ts`: route block inserted before donations POST, barrel exports added.
- 16 tests across 2 new test files. 538/538 total.
- PR #56: https://github.com/Magalvo/Pic4PawsV2/pull/56
