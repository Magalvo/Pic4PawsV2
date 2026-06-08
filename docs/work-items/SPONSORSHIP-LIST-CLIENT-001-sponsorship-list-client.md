# Work-Item: SPONSORSHIP-LIST-CLIENT-001 — Sponsorship List Client

## 1. Context & Problem

`SPONSORSHIP-LIST-WORKER-001` (merged, PR #64) exposes `GET /shelters/:shelterId/sponsorships`.
`@pic4paws/client` has no typed client for this route.

## 2. Acceptance Criteria

- [ ] Add `// ─── Sponsorship List Client ───` section to `packages/client/src/index.ts`
  before `// ─── Media Upload Flow Client ───`:
  - `SponsorshipClientStatus = 'active' | 'cancelled' | 'paused'`
  - `SponsorshipListItem` — sponsorshipId, amountCents, currency, paymentMethod,
    recurringInterval, status, petId, createdAt
  - `SponsorshipListQuery = { limit?, offset? }`
  - `SponsorshipListClientSuccess` — ok: true, status: 'ok', sponsorships, total
  - `SponsorshipListClientFailureStatus` — unauthenticated | forbidden |
    sponsorship_list_repository_not_configured | auth_adapter_not_configured |
    worker_request_failed | worker_response_invalid
  - `SponsorshipListClientFailure` — ok: false, status, reasons
  - `SponsorshipListClientResult` — union
  - `CreateSponsorshipListClientInput` — workerBaseUrl, shelterPath, getAccessToken, fetch
  - `SponsorshipListClient` — `loadSponsorships(shelterId, query?)`
  - `createSponsorshipListClient` — mirrors `createDonationListClient`:
    - no token → unauthenticated
    - `GET {shelterPath}/{shelterId}/sponsorships` with Bearer
    - fetch throws → worker_request_failed + network_error
    - non-ok → `parseSponsorshipListFailureStatus` + `sanitizeReasons`
    - ok but invalid → worker_response_invalid
    - valid → SponsorshipListClientSuccess
- [ ] Tests: `tests/client/sponsorship-list-client.test.ts` (≥ 8 tests, fail → pass)
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## 3. Non-Goals

- No Web or Mobile boundary in this item.

## 4. Completion Notes

_To be filled in after implementation._
