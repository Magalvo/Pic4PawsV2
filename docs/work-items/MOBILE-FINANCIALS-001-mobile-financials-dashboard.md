---
id: MOBILE-FINANCIALS-001
title: Mobile payment reconciliation dashboard product boundary
status: in-progress
---

## Goal

Mobile product boundary for shelter staff to view the payment reconciliation dashboard:
donation totals by status and active/paused/cancelled sponsorship counts.

## States

`idle | loading | loaded { summary } | forbidden | failed { status, reasons, canRetry }`

## Contract

```typescript
createMobileFinancialsDashboardUi({ financialsClient })
  .getInitialState()         → idle
  .loadFinancials(shelterId) → loaded | forbidden | failed
```

- No `empty` state — a shelter with no transactions still returns a valid zero summary
- PT-PT content, status: product-flow-ready
- `unsafeReasonMarkers` + `sanitizeReasons` on failed state

## Affected files

- `apps/mobile/src/financials.ts`
- `apps/mobile/src/foundation.ts` — financialsDashboard entry
- `tests/mobile/financials-dashboard-ui.test.ts`
