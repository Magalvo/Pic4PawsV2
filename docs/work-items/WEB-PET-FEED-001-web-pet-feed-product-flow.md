# Work-Item: WEB-PET-FEED-001 — Web Pet Feed Product Flow

## 1. Context & Problem

`PET-FEED-CLIENT-001` provides a `PetFeedClient` that wraps the public `GET /pets` Worker route.
The Web product layer has no boundary that maps feed results to PT-PT view models for the feed page.

## 2. Acceptance Criteria

- [ ] `createWebPetFeedUi({ feedClient })` — factory that returns `{ getInitialState, loadFeed }`.
- [ ] `getInitialState()` returns an idle view model with PT-PT copy (`locale: 'pt-PT'`).
- [ ] `loadFeed({ query })` calls `feedClient.loadFeed(query)` and maps to a typed view model.
- [ ] Success with ≥1 pet → `{ state: 'loaded', pets, total, query }` with PT-PT title.
- [ ] Success with 0 pets → `{ state: 'empty' }` with PT-PT copy.
- [ ] Failure → `{ state: 'failed', status, reasons, canRetry: true }` with PT-PT copy.
- [ ] `webPetFeedUiContent` exported with `locale: 'pt-PT'`, `status: 'product-flow-ready'`.
- [ ] Feed content exposed on `webFoundationContent.petFeed`.
- [ ] Result never contains credential markers (bearer, service-role, r2 secrets, signed URLs).
- [ ] Tests use injected fake `PetFeedClient`.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No species/filter UI wiring.
- No pagination UI (limit/offset inputs).

## 4. Completion Notes

_To be filled in after implementation._
