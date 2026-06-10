---
id: MOBILE-PET-STATUS-HISTORY-001
title: Mobile pet status history UI boundary
status: done
pr: 121
---

## Goal

Add `createMobilePetStatusHistoryUi` to `apps/mobile/src/pet-status-history.ts` wrapping
`PetStatusHistoryClient.loadStatusHistory` with a full product-boundary state machine.

## Contract

```typescript
createMobilePetStatusHistoryUi({ petStatusHistoryClient })
  .getInitialState()     → MobilePetStatusHistoryIdleState
  .loadHistory(petId)    → MobilePetStatusHistoryLoadedState | MobilePetStatusHistoryFailedState
```

States: idle | loading | loaded | forbidden | failed
Content type: `MobilePetStatusHistoryUiContent` (locale pt-PT, product-flow-ready)
`sanitizeReasons` applied on failed state; credentials never leak.

## Affected files

- `apps/mobile/src/pet-status-history.ts` — new boundary module
- `apps/mobile/src/foundation.ts` — add `petStatusHistory` entry
- `tests/mobile/pet-status-history-ui.test.ts` — new test file
