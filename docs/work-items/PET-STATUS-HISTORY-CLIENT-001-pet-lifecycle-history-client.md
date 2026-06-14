---
id: PET-STATUS-HISTORY-CLIENT-001
title: Pet lifecycle history client
status: done
pr: 119
---

## Goal

Add `createPetStatusHistoryClient` to `@pic4paws/client` wrapping the authenticated
`GET /pets/:petId/status-history` route added in `PET-STATUS-HISTORY-READ-001`.

## States

- `idle`: no request has started.
- `loading`: the status history route is being requested.
- `loaded`: lifecycle events were returned and validated.
- `forbidden`: the actor cannot view this pet's history.
- `failed`: the Worker request or response validation failed.

## Contract

```typescript
createPetStatusHistoryClient({ workerBaseUrl, petFeedPath, getAccessToken, fetch })
  .loadStatusHistory(petId) → LoadPetStatusHistoryClientResult
```

- URL: `{workerBaseUrl}{petFeedPath}/{petId}/status-history`
- Success: `{ ok: true, status: 'ok', petId, events: PetStatusHistoryEvent[] }`
- Failure statuses: unauthenticated | forbidden | pet_not_found |
  pet_archive_repository_not_configured | auth_adapter_not_configured |
  worker_request_failed | worker_response_invalid
- `sanitizeReasons` applied on all failure paths

## Affected files

- `packages/client/src/index.ts` — PetStatusHistoryClient types + factory
- `tests/client/pet-status-history-client.test.ts`
