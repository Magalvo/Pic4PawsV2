# Work-Item: DONATE-CONFIG-WORKER-001 — Shelter Payment Config Worker

status: open

## 1. Context & Problem

`DONATE-TIER-DB-001` (merged) adds the `shelter_payment_configs` table. There is no worker
route yet that lets a shelter owner save their IBAN / MB WAY phone number, nor one that
reads the current config. Until a shelter saves a manual payment config, `payment_account_status`
on the `shelters` row stays `'not_configured'` and the donation eligibility gate rejects all
donation attempts.

This task exposes the config CRUD endpoints and **atomically activates** the shelter's
payment account once a valid config is saved.

## Goal

Expose two authenticated routes for shelter payment configuration:
- `GET /shelters/:id/payment-config` — load the current config (returns tier, IBAN, phone).
- `POST /shelters/:id/payment-config` — upsert a manual config (IBAN required, MB WAY phone
  optional) and flip `shelters.payment_account_status` to `'active'`.

Only a verified (`shelter_not_verified` check) shelter owner or manager may write the config.
Any authenticated user with membership in the shelter may read it.

## States

- `unauthenticated`: no valid Bearer actor.
- `forbidden`: actor is authenticated but is not a member of the target shelter.
- `shelter_not_found`: the shelter does not exist.
- `invalid_config`: payload missing required fields or IBAN format is invalid.
- `payment_config_saved`: POST succeeded; shelter is now eligible to receive donations.
- `ok`: GET succeeded; config (or absence of config) returned.

## Acceptance Criteria

- [ ] Create `apps/workers/src/shelter-payment-config.ts`:
  - Types: `ShelterPaymentConfigInput`, `ShelterPaymentConfigResult`,
    `GetPaymentConfigResult`, `PaymentConfigRepository`.
  - `validatePaymentConfigPayload(payload)` — requires non-empty `iban` string, optional
    `mbWayPhone` (nullable string). Rejects if neither is provided.
  - `handleGetPaymentConfigRequest({ request, shelterId, repository, authenticator })`:
    - GET only → 405.
    - Auth → 401/501.
    - Membership check → 403 if actor is not a member of `shelterId`.
    - Returns `{ status: 'ok', configured: boolean, tier, iban, mbWayPhone }`.
  - `handleSavePaymentConfigRequest({ request, payload, shelterId, repository, authenticator })`:
    - POST only → 405.
    - Auth → 401/501.
    - Membership check → 403.
    - Validates payload → 400 `invalid_config` + `reasons`.
    - Upserts `shelter_payment_configs` row (`tier: 'manual'`) and sets
      `shelters.payment_account_status = 'active'` in the same DB operation.
    - Returns 200 `{ status: 'payment_config_saved', tier: 'manual', iban, mbWayPhone }`.
- [ ] Create `apps/workers/src/shelter-payment-config-supabase.ts` with
  `createSupabaseShelterPaymentConfigRepositories`.
  - `getPaymentConfig(shelterId)` — SELECT from `shelter_payment_configs` where
    `shelter_id = shelterId`.
  - `savePaymentConfig(shelterId, input)` — UPSERT into `shelter_payment_configs` (conflict
    on `shelter_id`) and UPDATE `shelters SET payment_account_status = 'active'`.
  - Membership check: `canManageShelter(actor, shelterId)` from `@pic4paws/domain`.
- [ ] Add `shelterPaymentConfigRepository?: ShelterPaymentConfigRepository` to
  `WorkerRequestDependencies` in `apps/workers/src/dependencies.ts`; wire in both factory
  functions.
- [ ] Add route matching for `GET /shelters/:id/payment-config` and
  `POST /shelters/:id/payment-config` in `apps/workers/src/routes/shelters.ts`.
- [ ] Tests in `tests/workers/shelter-payment-config.test.ts` use injected fakes (no DB/network).
  Cover: unauthenticated, forbidden, invalid IBAN, missing IBAN, valid save, load empty,
  load configured.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- The `apiKeyEncrypted` / `webhookSecretEncrypted` columns on `shelter_payment_configs`
  must never be read or written by this worker. Phase 2 only.
- The `payment_account_status` update on `shelters` must be atomic with the config upsert
  (single RPC or transaction) — a partial write must not leave the shelter in a
  misleadingly active state.
- Membership check must use `canManageShelter` from `@pic4paws/domain`, not the raw actor
  role string.

## 4. Non-Goals

- Do not implement Phase 2 automated-tier key storage or validation.
- Do not implement the donor-facing donation route changes (`DONATE-TIER-WORKER-001`).
- Do not add RLS policies to `shelter_payment_configs` (service role key used in Workers).

## Affected files

- `apps/workers/src/shelter-payment-config.ts`
- `apps/workers/src/shelter-payment-config-supabase.ts`
- `apps/workers/src/routes/shelters.ts`
- `apps/workers/src/dependencies.ts`
- `tests/workers/shelter-payment-config.test.ts`

## Completion Notes

Pending implementation.
