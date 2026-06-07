# Work-Item: MOBILE-PET-FEED-001 — Mobile Pet Feed Product Flow

## 1. Context & Problem

`PET-FEED-CLIENT-001` provides a `PetFeedClient`. The Mobile product layer has no boundary that
maps feed results to PT-PT view models for the adopter feed screen.

## 2. Acceptance Criteria

- [ ] `createMobilePetFeedUi({ feedClient })` — factory that returns `{ getInitialState, loadFeed }`.
- [ ] `getInitialState()` returns an idle view model with PT-PT copy (`locale: 'pt-PT'`).
- [ ] `loadFeed({ query })` calls `feedClient.loadFeed(query)` and maps to a typed view model.
- [ ] Success with ≥1 pet → `{ state: 'loaded', pets, total, query }` with PT-PT title.
- [ ] Success with 0 pets → `{ state: 'empty' }` with PT-PT copy.
- [ ] Failure → `{ state: 'failed', status, reasons, canRetry: true }` with PT-PT copy.
- [ ] `mobilePetFeedUiContent` exported with `locale: 'pt-PT'`, `status: 'product-flow-ready'`.
- [ ] Feed content exposed on `mobileFoundationContent.petFeed`.
- [ ] Result never contains credential markers.
- [ ] Tests use injected fake `PetFeedClient`.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Same as `WEB-PET-FEED-001`.

## 4. Completion Notes

_To be filled in after implementation._
