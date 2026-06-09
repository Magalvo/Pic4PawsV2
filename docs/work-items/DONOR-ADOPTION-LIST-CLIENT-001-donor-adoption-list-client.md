# Work-Item: DONOR-ADOPTION-LIST-CLIENT-001 — Donor Adoption List Client

## 1. Context & Problem

`DONOR-ADOPTION-LIST-WORKER-001` added `GET /adoptions` returning the authenticated actor's
own applications.

The shared client package needs `createAdoptionDonorListClient` so both Web and Mobile
product boundaries can list donor adoptions without coupling directly to the Worker API.

## 2. Acceptance Criteria

- [ ] `AdoptionDonorListItem` type defined with `applicationId`, `petId`, `shelterId`, `status`, `submittedAt` (no PII fields).
- [ ] `AdoptionDonorListQuery` type defined with `limit?`, `offset?`.
- [ ] `AdoptionDonorListClientSuccess` type defined.
- [ ] `AdoptionDonorListClientFailureStatus` union defined.
- [ ] `AdoptionDonorListClientResult` discriminated union defined.
- [ ] `CreateAdoptionDonorListClientInput` type defined.
- [ ] `AdoptionDonorListClient` type defined with `loadDonorAdoptions(query?)`.
- [ ] `createAdoptionDonorListClient` factory exported from `@pic4paws/client`.
- [ ] `loadDonorAdoptions` calls `GET {adoptionsPath}` with Bearer token and optional limit/offset.
- [ ] Maps success response to `{ ok: true, status: 'ok', applications, total }`.
- [ ] Maps unauthenticated and 501 failures to typed statuses.
- [ ] All types and factory exported from `packages/client/src/index.ts`.
- [ ] Tests covering: success, auth failure, 501, network error.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement product boundaries in this item.

## 4. Completion Notes

Implemented in commit `c1c7be9` on branch `agent/donor-adoption-list-batch`.

- `packages/client/src/index.ts` — appended `AdoptionDonorListItem`, `AdoptionDonorListQuery`, `AdoptionDonorListClientSuccess`, `AdoptionDonorListClientFailureStatus`, `AdoptionDonorListClientFailure`, `AdoptionDonorListClientResult`, `CreateAdoptionDonorListClientInput`, `AdoptionDonorListClient`, and `createAdoptionDonorListClient` factory.
- `tests/client/adoption-donor-list-client.test.ts` — 6 tests.
