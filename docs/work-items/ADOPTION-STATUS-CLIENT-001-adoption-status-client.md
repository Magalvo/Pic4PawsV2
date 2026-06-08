# Work-Item: ADOPTION-STATUS-CLIENT-001 — Adoption Status Client

## 1. Context & Problem

`ADOPTION-STATUS-WORKER-001` (merged PR #76) provides `PATCH /adoptions/:applicationId` for
shelter staff to move adoption applications through the review lifecycle.
There is no client yet, so Web/Mobile product boundaries cannot call it.

## 2. Acceptance Criteria

- [x] Add `// ─── Adoption Status Client ───` section to `packages/client/src/index.ts`:
  - `AdoptionStatusShelterManageStatus` — union of the 4 shelter-settable statuses
  - `AdoptionStatusClientSuccess` — `{ ok: true; status: 'ok'; applicationId; newStatus }`
  - `AdoptionStatusClientFailureStatus` — 8 failure statuses
  - `AdoptionStatusClient` — `manageAdoptionStatus(applicationId, status)`
  - `createAdoptionStatusClient({ workerBaseUrl, adoptionsPath, getAccessToken, fetch })`
  - Uses `createWorkerSubUrl(workerBaseUrl, adoptionsPath, applicationId)` — PATCH sub-URL
- [x] Tests: `tests/client/adoption-status-client.test.ts` (≥ 11 tests, fail → pass).
- [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Failure Statuses

```
unauthenticated | forbidden | adoption_not_found | invalid_adoption_status
| adoption_status_repository_not_configured | auth_adapter_not_configured
| worker_request_failed | worker_response_invalid
```

## 4. Completion Notes

Implemented in PR #77 on branch `agent/ADOPTION-STATUS-CLIENT-001`.
- 11 tests
- All validation clean
