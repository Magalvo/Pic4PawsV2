# SHELTER-SEARCH-WORKER-001 — Shelter Search Worker Route

## Goal

Add a public `GET /shelters` paginated list route that allows adopters to discover shelters without prior knowledge of a shelter ID.

## Route

`GET /shelters`

- Public — no authentication required
- Query params: `limit` (1–50, default 20), `offset` (≥0, default 0), `kind` (optional filter)
- Path matched with exact comparison (`url.pathname === config.workers.shelterPath`)
- Registered **before** `matchWorkerShelterMemberRemoveIds` in index.ts

## Response shape

```
200 OK
{ status: 'ok', shelters: PublicShelterSummary[], total: number }

405 Method Not Allowed (non-GET)
{ status: 'method_not_allowed', allowedMethods: ['GET'] }

501 Not Implemented (repository not injected)
{ status: 'shelter_search_repository_not_configured' }
```

## PublicShelterSummary

Lean subset of PublicShelterProfile suitable for list cards:
id, name, slug, kind, verificationStatus, city, district, countryCode, logoMediaId

Omits: description, publicEmail, publicPhone, coverMediaId (detail-view fields).

## Repository interface

```typescript
ShelterSearchQuery = { limit: number; offset: number; kind?: ShelterKind | null }
ShelterSearchResult = { shelters: PublicShelterSummary[]; total: number }
ShelterSearchRepository = {
  searchShelters: (query: ShelterSearchQuery) => Promise<ShelterSearchResult>
}
```

Supabase impl: SELECT verified shelters only (`verification_status = 'verified'`), ordered by name, with optional kind filter.

## Files

- `apps/workers/src/shelter-search.ts` — types, handler
- `apps/workers/src/shelter-search-supabase.ts` — Supabase repository impl
- `apps/workers/src/dependencies.ts` — add `shelterSearchRepository`
- `apps/workers/src/index.ts` — wire route + barrel exports
- `tests/workers/shelter-search.test.ts` — tests
