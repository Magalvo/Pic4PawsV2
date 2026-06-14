---
id: SHELTER-SEARCH-CLIENT-001
title: Shelter search client
status: done
pr: 102
---

## Goal

Add `createShelterSearchClient` to `@pic4paws/client` wrapping the public
`GET /shelters` paginated list route added in `SHELTER-SEARCH-WORKER-001`.

## States

- `idle`: no search has been submitted.
- `loading`: the public shelter list route is being requested.
- `loaded`: shelter summaries and total count were returned.
- `failed`: request or response validation failed with sanitized reasons.

## Contract

```typescript
createShelterSearchClient({ workerBaseUrl, shelterPath, fetch })
  .searchShelters(query) → ShelterSearchClientResult
```

- No authentication required (public route)
- `query`: `{ name?: string; city?: string; limit?: number; offset?: number }`
- Success: `{ ok: true, shelters: ShelterSearchClientShelter[], total: number, query }`
- Failure: `{ ok: false, status: ShelterSearchClientFailureStatus, reasons: string[] }`

## Affected files

- `packages/client/src/index.ts` — ShelterSearchClient types + createShelterSearchClient
- `tests/client/shelter-search-client.test.ts`
