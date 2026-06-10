---
id: WEB-PET-STATUS-HISTORY-001
title: Web pet status history UI boundary
status: done
pr: 120
---

## Goal

Add `createWebPetStatusHistoryUi` to `apps/web/src/pet-status-history.ts` wrapping
`PetStatusHistoryClient.loadStatusHistory` with a full product-boundary state machine.

## Contract

```typescript
createWebPetStatusHistoryUi({ petStatusHistoryClient })
  .getInitialState()     → WebPetStatusHistoryIdleState
  .loadHistory(petId)    → WebPetStatusHistoryLoadedState | WebPetStatusHistoryFailedState
```

States: idle | loading | loaded | forbidden | failed
Content type: `WebPetStatusHistoryUiContent` (locale pt-PT, product-flow-ready)
`sanitizeReasons` applied on failed state; credentials never leak.

## Affected files

- `apps/web/src/pet-status-history.ts` — new boundary module
- `apps/web/src/foundation.ts` — add `petStatusHistory` entry
- `tests/web/pet-status-history-ui.test.ts` — new test file
