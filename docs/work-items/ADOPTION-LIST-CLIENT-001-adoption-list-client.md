# Work-Item: ADOPTION-LIST-CLIENT-001 — Adoption List Client

## 1. Context & Problem

`ADOPTION-LIST-WORKER-001` (merged) exposes `GET /shelters/:shelterId/adoptions`.
Without a platform-neutral client adapter, Web and Mobile cannot call this endpoint from
their product boundaries.

## 2. Acceptance Criteria

- [ ] Add `AdoptionApplicationStatus` union type (8 statuses) to `@pic4paws/client`.
- [ ] Add `AdoptionListApplication` type (applicationId, petId, applicantUserId,
  applicantFullName, applicantEmail, applicantCity, status, submittedAt).
- [ ] Add `AdoptionListQuery` type (limit?, offset?).
- [ ] Add `AdoptionListClientSuccess` type (`ok: true`, status `'ok'`, applications, total).
- [ ] Add `AdoptionListClientFailureStatus` union (unauthenticated, forbidden,
  adoption_list_repository_not_configured, auth_adapter_not_configured,
  worker_request_failed, worker_response_invalid).
- [ ] Add `AdoptionListClientFailure` and `AdoptionListClientResult` types.
- [ ] Add `CreateAdoptionListClientInput` type (workerBaseUrl, shelterPath, getAccessToken, fetch).
- [ ] Add `AdoptionListClient` type with `loadApplications(shelterId, query?)`.
- [ ] Export `createAdoptionListClient` factory that:
  - Returns `unauthenticated` when `getAccessToken()` resolves to `null`/empty.
  - Builds URL as `{workerBaseUrl}/{shelterPath}/{shelterId}/adoptions` using
    `createWorkerSubUrl` (with encoded `shelterId`).
  - Appends `limit` / `offset` as query params when non-null.
  - Sends `GET` with `Authorization: Bearer {token}`.
  - On network throw → `worker_request_failed` + `network_error`.
  - On non-ok response → `parseAdoptionListFailureStatus` + `sanitizeReasons`.
  - On ok but invalid body → `worker_response_invalid`.
  - On ok valid body → `AdoptionListClientSuccess`.
- [ ] Tests use injected fake fetch — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Web or Mobile boundaries (WEB-ADOPTION-LIST-001 / MOBILE-ADOPTION-LIST-001).
- Do not implement status transitions (approve/reject).

## 4. Completion Notes

_To be filled in after implementation._
