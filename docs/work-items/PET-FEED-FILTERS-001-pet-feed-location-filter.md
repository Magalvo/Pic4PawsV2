# PET-FEED-FILTERS-001 — Pet feed location filter

## Goal

Add `location` query param to `GET /pets` so adopters can narrow the feed to pets
in a specific location. The `species` filter already exists at all layers; this
work item adds the parallel `location` filter only.

## States

No new UI states — the existing `loaded`, `empty`, `failed`, `idle` states are
sufficient. The `query` object already flows through to `loaded` and `empty` states.

## Contract

### Worker

`GET /pets?location=Lisboa` passes `location: 'Lisboa'` to the repository.
Whitespace is trimmed; empty string is treated as absent (null).

### PetFeedQuery (worker / Supabase)

```ts
export type PetFeedQuery = {
  species?: PetLifecycleSpecies | null;
  location?: string | null;   // NEW
  limit: number;
  offset: number;
};
```

### PetFeedClientQuery (client)

```ts
export type PetFeedClientQuery = {
  species?: PetLifecycleSpecies | null;
  location?: string | null;   // NEW
  limit?: number | null;
  offset?: number | null;
};
```

### Supabase

Apply `.eq('location_label', query.location)` to both count and data queries when
`query.location` is non-null, mirroring the existing species filter pattern.

### Web / Mobile boundaries

No changes needed — both boundaries already thread `query` through to `loaded`
and `empty` states.

## Affected files

- `apps/workers/src/pet-feed.ts` (modify) — add `location` to `PetFeedQuery`, add
  `parseLocation`, apply in handler
- `apps/workers/src/pet-supabase.ts` (modify) — apply `location_label` eq filter
- `packages/client/src/index.ts` (modify) — add `location` to `PetFeedClientQuery`,
  add to URL param building in `createPetFeedClient`
- `tests/workers/pet-feed.test.ts` (modify) — add location filter tests
- `tests/client/pet-feed-client.test.ts` (modify) — add location URL param test
