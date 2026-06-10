---
id: MOBILE-SHELTER-SEARCH-001
title: Mobile shelter search product boundary
status: done
pr: 104
---

## Goal

Mobile product boundary for public shelter search, mirroring `WEB-SHELTER-SEARCH-001`.

## States

`idle | loading | loaded { shelters, total, query } | empty { query } | failed { status, reasons, canRetry }`

## Contract

```typescript
createMobileShelterSearchUi({ shelterSearchClient })
  .searchShelters(query) → MobileShelterSearchState
```

## Affected files

- `apps/mobile/src/shelter-search.ts`
- `apps/mobile/src/foundation.ts` — shelterSearch entry added
- `tests/mobile/shelter-search-ui.test.ts`
