---
id: SHELTER-SEARCH-CLIENT-001
title: Shelter search client
status: done
pr: 102
---

## Goal

Add `createShelterSearchClient` to `@pic4paws/client` wrapping the public
`GET /shelters` paginated list route added in `SHELTER-SEARCH-WORKER-001`.

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
