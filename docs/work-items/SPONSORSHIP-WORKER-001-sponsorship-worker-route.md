# Work-Item: SPONSORSHIP-WORKER-001 — Sponsorship Worker Route

## 1. Context & Problem

The donation slice is complete. Recurring sponsorships (padrinhos) are a distinct concept:
a donor commits to a recurring payment (monthly/quarterly/annual) to support a shelter or
a specific pet. They need their own route, repository, and table so they can be managed
independently from one-off donations.

## 2. Acceptance Criteria

- [ ] Add `WORKER_SPONSORSHIPS_PATH` (default `/sponsorships`) to `packages/config/src/env.ts`
  and `EnvironmentConfig.workers`.
- [ ] Create `apps/workers/src/sponsorship.ts`:
  - `SponsorshipRecurringInterval`: `'monthly' | 'quarterly' | 'annual'`.
  - `CreateSponsorshipInput`: `{ donorUserId, shelterId, petId, amountCents, currency,
    paymentMethod, recurringInterval, provider, createdAt }`.
  - `CreateSponsorshipResult`: `{ sponsorshipId, createdAt }`.
  - `SponsorshipRepository`: `{ createSponsorship(input) }`.
  - `validateSponsorshipPayload(payload)` — validates request body: `shelterId` required,
    `amountCents ≥ 100`, `paymentMethod` valid, `recurringInterval` valid,
    `dataProcessingAccepted === true`; `petId` optional nullable.
  - `handleWorkerSponsorshipRequest({ request, payload, sponsorshipRepository?, authenticator?,
    provider, now })` — 405 → 401 → 501 → 401 → 400 → 501 → 201.
    `donorUserId` always from authenticated actor (never from client body).
    Returns `{ status: 'sponsorship_created', sponsorshipId, amountCents, currency,
    recurringInterval, shelterId, createdAt }`.
- [ ] Create `apps/workers/src/sponsorship-supabase.ts`:
  - `createSupabaseSponsorshipRepositories({ client })` → `{ sponsorshipRepository }`.
  - INSERT into `sponsorships` table; SELECT `id, created_at`.
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `sponsorshipRepository?: SponsorshipRepository`.
  - Import/wire from `sponsorship-supabase.ts` factory.
- [ ] Modify `apps/workers/src/index.ts`:
  - Import and route `POST config.workers.sponsorshipsPath` to `handleWorkerSponsorshipRequest`.
  - Barrel-export all new types and functions.
- [ ] Tests: `tests/workers/sponsorship.test.ts` (≥ 10 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No client or UI boundary in this item (`SPONSORSHIP-CLIENT-001` follows separately).
- No cancellation or management routes in this item.
- No provider subscription ID wiring (stub with `crypto.randomUUID()` like donation).

## 4. Completion Notes

_To be filled in after implementation._
