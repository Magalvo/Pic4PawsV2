# Work-Item: DONATE-CONFIG-CLIENT-001 — Shelter Payment Config Client

status: open

## 1. Context & Problem

`DONATE-CONFIG-WORKER-001` (merged) exposes `GET /shelters/:id/payment-config` and
`POST /shelters/:id/payment-config`. No client package functions exist yet — the mobile
and web shelter management screens cannot reach these endpoints.

## Goal

Add `createShelterPaymentConfigClient` and `createLoadPaymentConfigClient` to
`packages/client` so that the shelter payment config UI modules can call the worker
without direct HTTP knowledge.

## States

- `unauthenticated`: token missing or expired.
- `forbidden`: actor is not a shelter member.
- `shelter_not_found`: shelter does not exist.
- `invalid_config`: POST payload validation failed server-side.
- `payment_config_saved`: POST succeeded.
- `ok`: GET succeeded.
- `worker_request_failed` / `worker_response_invalid`: network/parse failure.

## Acceptance Criteria

- [ ] Add `packages/client/src/shelter-payment-config.ts` with:
  - `ShelterPaymentConfigClientInput` — `{ iban: string; mbWayPhone?: string | null }`.
  - `ShelterPaymentConfigClientSuccess` — `{ ok: true; status: 'payment_config_saved'; tier: 'manual'; iban: string; mbWayPhone: string | null }`.
  - `LoadPaymentConfigClientSuccess` — `{ ok: true; status: 'ok'; configured: boolean; tier: 'manual' | 'automated' | null; iban: string | null; mbWayPhone: string | null }`.
  - Failure types for both operations with `reasons: string[]`.
  - `createSavePaymentConfigClient({ workerBaseUrl, shelterPath, getAccessToken, fetch })`:
    - `savePaymentConfig(shelterId, input)` → POST to `/shelters/:id/payment-config`.
  - `createLoadPaymentConfigClient({ workerBaseUrl, shelterPath, getAccessToken, fetch })`:
    - `loadPaymentConfig(shelterId)` → GET `/shelters/:id/payment-config`.
- [ ] Export both factories and all types from `packages/client/src/index.ts`.
- [ ] Tests in `tests/client/shelter-payment-config-client.test.ts` use fake fetch. Cover:
  - Save: unauthenticated, invalid config (server), success.
  - Load: unauthenticated, success (configured), success (not configured).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement mobile or web UI modules (see `MOBILE-DONATE-CONFIG-001`, `WEB-DONATE-CONFIG-001`).
- Do not validate IBAN format client-side — leave validation to the server.

## Affected files

- `packages/client/src/shelter-payment-config.ts`
- `packages/client/src/index.ts`
- `tests/client/shelter-payment-config-client.test.ts`

## Completion Notes

Pending implementation.
