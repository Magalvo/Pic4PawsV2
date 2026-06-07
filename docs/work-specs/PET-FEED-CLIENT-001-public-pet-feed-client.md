# Work-Spec: Implementation Plan for PET-FEED-CLIENT-001

## 1. Target Files

- `docs/work-items/PET-FEED-CLIENT-001-public-pet-feed-client.md`
- `docs/work-specs/PET-FEED-CLIENT-001-public-pet-feed-client.md`
- `packages/client/src/index.ts` (add types + `createPetFeedClient`)
- `tests/client/pet-feed-client.test.ts` (new)

## 2. New Types

Add to `packages/client/src/index.ts`:

```ts
export type PetFeedPet = {
  id: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  heroMediaId: string | null;
  mediaIds: string[];
  publishedAt: string;
};

export type PetFeedClientQuery = {
  species?: PetLifecycleSpecies | null;
  limit?: number | null;
  offset?: number | null;
};

export type PetFeedClientSuccess = {
  ok: true;
  status: 'ok';
  pets: PetFeedPet[];
  total: number;
};

export type PetFeedClientFailureStatus =
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type PetFeedClientFailure = {
  ok: false;
  status: PetFeedClientFailureStatus;
  reasons: string[];
};

export type PetFeedClientResult = PetFeedClientSuccess | PetFeedClientFailure;

export type CreatePetFeedClientInput = {
  workerBaseUrl: string;
  petFeedPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type PetFeedClient = {
  loadFeed: (query: PetFeedClientQuery) => Promise<PetFeedClientResult>;
};
```

## 3. Implementation

`createPetFeedClient`:
1. Build URL from `createWorkerUrl(workerBaseUrl, petFeedPath)`.
2. Append query params: `species`, `limit`, `offset` when non-null/non-undefined.
3. Call `fetch(url)` with `GET` (no body, no Authorization header).
4. On network error (thrown): return `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }`.
5. On non-ok HTTP: parse body → extract reasons → sanitize → return `worker_request_failed`.
6. On ok HTTP: parse JSON body → validate shape (`status === 'ok'`, pets array, total number) →
   if invalid return `worker_response_invalid` → if valid return `{ ok: true, status: 'ok', pets, total }`.

`parsePetFeedSuccess`: validates `body.status === 'ok'`, `Array.isArray(body.pets)`, `typeof body.total === 'number'`.
Returns `PetFeedClientSuccess | null`.

No auth token needed. No request body needed.

## 4. Testing Strategy

Fake `fetch` that returns a pre-built `Response`. No real network calls.

| # | Scenario | Expected |
|---|---|---|
| 1 | fetch returns `{ status: 'ok', pets: [pet1, pet2], total: 2 }` | success with pets |
| 2 | fetch returns `{ status: 'ok', pets: [], total: 0 }` | success with empty pets |
| 3 | query with species — check URL search params | `?species=dog` in request URL |
| 4 | query with limit and offset — check URL search params | `?limit=5&offset=10` in request URL |
| 5 | query with no params — check no query string added | clean URL, no `?` |
| 6 | fetch returns non-ok HTTP (503) | `worker_request_failed` |
| 7 | fetch throws (network error) | `worker_request_failed` with `network_error` |
| 8 | fetch returns ok but malformed body (missing `pets`) | `worker_response_invalid` |
| 9 | failure reasons from server stripped of credential markers | no signedUrl, no bearer in output |

## 5. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 6. Risk Controls

- No auth credentials in client requests or responses.
- `PetFeedPet` is a strict allowlist; no private fields included.
- `sanitizeReasons` applied to all failure reason arrays.
