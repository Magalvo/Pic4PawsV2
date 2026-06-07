# Work-Spec: ADOPTION-LIST-CLIENT-001 — Adoption List Client

## HTTP call

```
GET {workerBaseUrl}/{shelterPath}/{shelterId}/adoptions[?limit=N&offset=M]
Authorization: Bearer {accessToken}
```

URL built with `createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'adoptions')`.

## Client interface

```ts
AdoptionListClient = {
  loadApplications: (shelterId: string, query?: AdoptionListQuery) => Promise<AdoptionListClientResult>
}
```

## Success response (200)

```json
{
  "status": "ok",
  "applications": [
    {
      "applicationId": "app-001",
      "petId": "pet-1",
      "applicantUserId": "user-1",
      "applicantFullName": "Maria Silva",
      "applicantEmail": "maria@example.pt",
      "applicantCity": "Lisboa",
      "status": "submitted",
      "submittedAt": "2026-06-07T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

Parsed as `AdoptionListClientSuccess` when `status === 'ok'`, `applications` is array,
`total` is number.

## Failure status mapping

| Worker body `status`                      | Client status                             |
|-------------------------------------------|-------------------------------------------|
| `unauthenticated`                         | `unauthenticated`                         |
| `forbidden`                               | `forbidden`                               |
| `adoption_list_repository_not_configured` | `adoption_list_repository_not_configured` |
| `auth_adapter_not_configured`             | `auth_adapter_not_configured`             |
| anything else                             | `worker_request_failed`                   |

Network throw → `worker_request_failed` + `['network_error']`.
Valid HTTP but invalid body → `worker_response_invalid` + `['invalid_worker_response']`.

## Credential sanitization

All failure `reasons` pass through `sanitizeReasons` before returning to caller.

## Files Affected

- `packages/client/src/index.ts` — append adoption list types + `createAdoptionListClient`
- `tests/client/adoption-list-client.test.ts` — new (10 tests)
- `docs/work-items/ADOPTION-LIST-CLIENT-001-...md` — new
- `docs/work-specs/ADOPTION-LIST-CLIENT-001-...md` — new
