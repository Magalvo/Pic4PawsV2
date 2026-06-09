# WEB-SHELTER-SEARCH-001 — Web Shelter Search UI Boundary

## Goal

Add the web product boundary for public shelter search — mirrors the `pet-feed` pattern for a paginated, filterable list of verified shelters.

## States

- `idle` — initial state before any search
- `loading` — in-flight (content object only, no runtime state)
- `loaded` — shelters returned (≥1)
- `empty` — search returned 0 results
- `failed` — client error (network or invalid response)

## API

```typescript
createWebShelterSearchUi({ shelterSearchClient })
  .getInitialState() → WebShelterSearchIdleState
  .searchShelters(query) → Promise<WebShelterSearchResultViewModel>
```

## State shapes

```typescript
WebShelterSearchIdleState  = { state: 'idle'; title; message; primaryAction }
WebShelterSearchLoadedState = { state: 'loaded'; title; shelters: ShelterSearchClientShelter[]; total; query }
WebShelterSearchEmptyState  = { state: 'empty'; title; message; query }
WebShelterSearchFailedState = { state: 'failed'; title; message; status; reasons; canRetry: true }
WebShelterSearchResultViewModel = loaded | empty | failed
```

## Content object

`webShelterSearchUiContent` — locale `pt-PT`, status `product-flow-ready`, states array covering all 5 states.

## Security

Failed state must strip credential markers via `sanitizeReasons`. Tests must assert `service-role` and `bearer ` are not in serialized output.

## Foundation

Register `shelterSearch` in `WebFoundationContent` and `webFoundationContent`.

## Files

- `apps/web/src/shelter-search.ts` — types, content, UI factory
- `apps/web/src/foundation.ts` — add shelterSearch entry
- `tests/web/shelter-search-ui.test.ts` — tests
