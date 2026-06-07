# Work-Spec: Implementation Plan for PET-FEED-WORKER-001

## 1. Target Files

- `docs/work-items/PET-FEED-WORKER-001-public-pet-feed-worker-route.md`
- `docs/work-specs/PET-FEED-WORKER-001-public-pet-feed-worker-route.md`
- `apps/workers/src/pet-feed.ts` (new)
- `apps/workers/src/pet-supabase.ts` (add `loadPublishedPets`)
- `apps/workers/src/dependencies.ts` (add `petFeedRepository`)
- `apps/workers/src/index.ts` (add GET /pets route + export)
- `tests/workers/pet-feed.test.ts` (new)
- `docs/work-tracks/remake-foundation.md`
- `docs/agent-resume.md`

## 2. New Types

### `apps/workers/src/pet-feed.ts`

```ts
export type PublishedPetSummary = {
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

export type PetFeedQuery = {
  species?: PetLifecycleSpecies | null;
  limit: number;
  offset: number;
};

export type PetFeedResult = {
  pets: PublishedPetSummary[];
  total: number;
};

export type PetFeedRepository = {
  loadPublishedPets: (query: PetFeedQuery) => Promise<PetFeedResult>;
};
```

The `handleWorkerPetFeedRequest` function accepts a `Request`, config, and injected `PetFeedRepository`.

### Query parameter parsing

From `URL.searchParams`:
- `species` — validated against the known species enum; invalid values ignored (treated as absent)
- `limit` — parsed as integer, clamped to `[1, 50]`, defaults to `20`
- `offset` — parsed as non-negative integer, defaults to `0`

## 3. Route Design

```
GET /pets
```

No auth header required. No request body.

**Success response (200)**:
```json
{
  "status": "ok",
  "pets": [...],
  "total": 42
}
```

**Repository not configured (501)**:
```json
{ "status": "pet_feed_repository_not_configured" }
```

**Method not allowed (405)**:
```json
{ "status": "method_not_allowed", "allowedMethods": ["GET"] }
```

## 4. Supabase Implementation

Add `loadPublishedPets` to `createSupabasePetRepositories`:

```sql
SELECT id, shelter_id, name, species, location_label, short_description,
       hero_media_id, media_ids, published_at
FROM pets
WHERE status = 'published'
  AND deleted_at IS NULL
  [AND species = :species]
ORDER BY published_at DESC
LIMIT :limit OFFSET :offset
```

The count query uses a separate `SELECT count(*)` with the same filters.

`PetFeedRepository` is added to `WorkerRequestDependencies` and wired in
`resolveWorkerRequestDependencies` and `createSupabaseSdkWorkerDependencies`.

## 5. Config wiring

Add `petFeedPath` to `EnvironmentConfig.workers` (defaulting to `/pets`) so tests can vary the path
without hardcoding it. Check whether this path is already in the config package before adding it.

## 6. Testing Strategy

All tests use an injected fake `PetFeedRepository`. No real Supabase calls.

| # | Scenario | Expected |
|---|---|---|
| 1 | GET /pets, repository returns two pets | 200 with pets array and total |
| 2 | GET /pets?species=dog | repository called with `{ species: 'dog', limit: 20, offset: 0 }` |
| 3 | GET /pets?limit=5&offset=10 | repository called with `{ limit: 5, offset: 10 }` |
| 4 | GET /pets?limit=200 | limit clamped to 50 |
| 5 | GET /pets?species=invalid_value | species treated as absent |
| 6 | GET /pets, repository not injected | 501 `pet_feed_repository_not_configured` |
| 7 | POST /pets | 405 method not allowed |
| 8 | GET /pets, empty result | 200 with empty array and total 0 |
| 9 | Response never contains draft fields (`status: 'draft'`, private medical detail markers) |

## 7. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 8. Risk Controls

- No auth required — this is intentionally public; private data must not leak into `PublishedPetSummary`.
- `PublishedPetSummary` is a strict allowlist of fields; the Supabase query selects only those columns.
- No bearer tokens, service-role keys or signed URLs in the response.
- Repository is injected; real Supabase calls only happen in production wiring.
