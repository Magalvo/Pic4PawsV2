# Work-Spec: Implementation Plan for MOBILE-PET-FEED-001

## 1. Target Files

- `docs/work-items/MOBILE-PET-FEED-001-mobile-pet-feed-product-flow.md`
- `docs/work-specs/MOBILE-PET-FEED-001-mobile-pet-feed-product-flow.md`
- `apps/mobile/src/pet-feed.ts` (new)
- `apps/mobile/src/foundation.ts` (add `petFeed` to content)
- `tests/mobile/pet-feed-ui.test.ts` (new)

## 2. New Types and Exports

Mirror of `WEB-PET-FEED-001` with `Mobile`-prefixed types:
- `MobilePetFeedIdleState`, `MobilePetFeedLoadedState`, `MobilePetFeedEmptyState`, `MobilePetFeedFailedState`
- `MobilePetFeedResultViewModel`
- `MobilePetFeedUiContent`
- `mobilePetFeedUiContent`
- `createMobilePetFeedUi`

## 3. PT-PT Copy

Same as `WEB-PET-FEED-001` — identical copy, different type names.

## 4. Factory

Same pattern as Web: `createMobilePetFeedUi({ feedClient })` returning `{ getInitialState, loadFeed }`.

## 5. Foundation Wiring

Add to `apps/mobile/src/foundation.ts`:
```ts
import { mobilePetFeedUiContent, type MobilePetFeedUiContent } from './pet-feed';

// In MobileFoundationContent type:
petFeed: Pick<MobilePetFeedUiContent, 'title' | 'description' | 'status'>

// In mobileFoundationContent object:
petFeed: { title: ..., description: ..., status: ... }
```

## 6. Testing Strategy

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | idle state with PT-PT copy |
| 2 | `loadFeed` with 2 pets | `loaded` state with pets + total |
| 3 | `loadFeed` with 0 pets | `empty` state |
| 4 | `loadFeed` fails `worker_request_failed` | `failed` state with PT-PT copy |
| 5 | `loadFeed` fails `worker_response_invalid` | `failed` state |
| 6 | failure result has no credential markers | `JSON.stringify` check |
| 7 | `mobilePetFeedUiContent.locale === 'pt-PT'` | content check |
| 8 | foundation content exposes `petFeed.status === 'product-flow-ready'` | foundation check |
