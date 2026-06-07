# Work-Item: PET-FEED-WORKER-001 — Public Pet Feed Worker Route

## 1. Context & Problem

The Worker has a complete write path for pet drafts (create, update, media attach, publish).
There is no read path: no route exists to serve published pets to adopters or the public feed.

The paw-feed is the product's core discovery surface. Without a `GET /pets` endpoint, no client can
retrieve published pets, blocking the feed, search, and pet profile views.

## 2. Acceptance Criteria

- [ ] Add a `GET /pets` route on the Worker that returns a paginated list of published pets.
- [ ] The route requires no authentication — it is a public endpoint.
- [ ] The route accepts optional query parameters: `species`, `limit` (default 20, max 50), `offset` (default 0).
- [ ] The response body is `{ status: 'ok', pets: PublishedPetSummary[], total: number }`.
- [ ] `PublishedPetSummary` contains only safe public fields: `id`, `shelterId`, `name`, `species`, `locationLabel`, `shortDescription`, `heroMediaId`, `mediaIds`, `publishedAt`.
- [ ] Draft pets, archived pets and pets from unverified shelters are never returned.
- [ ] Add a `PetFeedRepository` interface to `apps/workers/src/pet-feed.ts` with injected dependency.
- [ ] Add a Supabase implementation of `PetFeedRepository` in `apps/workers/src/pet-supabase.ts`.
- [ ] Wire `petFeedRepository` into `WorkerRequestDependencies` and `createSupabasePetRepositories`.
- [ ] Tests use injected fake repositories — no real Supabase or network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement single-pet-by-ID fetch (separate work item).
- Do not implement shelter-filtered feeds or full-text search.
- Do not add authentication or shelter-owner feed views.
- Do not implement pagination cursors — limit/offset is sufficient for this item.
- Do not implement CDN cache headers or edge caching.

## 4. Completion Notes

_To be filled in after implementation._
