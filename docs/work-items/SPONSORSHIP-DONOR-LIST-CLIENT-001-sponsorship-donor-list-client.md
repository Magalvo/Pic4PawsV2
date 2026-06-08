# Work-Item: SPONSORSHIP-DONOR-LIST-CLIENT-001 — Sponsorship Donor List Client

## 1. Context & Problem

`SPONSORSHIP-DONOR-LIST-WORKER-001` (merged, PR #72) exposes `GET /sponsorships` returning
the authenticated donor's own sponsorships. Product boundaries (web/mobile) need a typed
client to call this route.

## 2. Acceptance Criteria

- [x] Add to `packages/client/src/index.ts`:
  - `SponsorshipDonorListQuery` — optional `limit`, `offset`.
  - `SponsorshipDonorListClientSuccess` — `{ ok: true; status: 'ok'; sponsorships: SponsorshipListItem[]; total: number }`.
  - `SponsorshipDonorListClientFailureStatus` — 5 statuses.
  - `SponsorshipDonorListClientResult` union.
  - `CreateSponsorshipDonorListClientInput` — `{ workerBaseUrl, sponsorshipsPath, getAccessToken, fetch }`.
  - `SponsorshipDonorListClient` — `loadDonorSponsorships(query?)`.
  - `createSponsorshipDonorListClient` — implementation.
- [x] Tests: `tests/client/sponsorship-donor-list-client.test.ts` (11 tests, fail → pass).
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Failure Statuses

| Status                                              | Source                         |
|-----------------------------------------------------|--------------------------------|
| `unauthenticated`                                   | no/blank token, 401 response   |
| `sponsorship_donor_list_repository_not_configured`  | 501 from worker                |
| `auth_adapter_not_configured`                       | 501 from worker                |
| `worker_request_failed`                             | fetch throws / unknown 4xx/5xx |
| `worker_response_invalid`                           | 200 but malformed body         |

## 4. Completion Notes

Implemented. Reuses `SponsorshipListItem` (same shape returned by worker for both
shelter-list and donor-list). URL is `{workerBaseUrl}{sponsorshipsPath}` (no sub-path).
`createWorkerUrl` used directly (not `createWorkerSubUrl`).
