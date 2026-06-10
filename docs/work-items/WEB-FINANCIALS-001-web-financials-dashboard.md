---
id: WEB-FINANCIALS-001
title: Web payment reconciliation dashboard product boundary
status: in-progress
---

## Goal

Web product boundary for shelter staff to view the payment reconciliation dashboard:
donation totals by status and active/paused/cancelled sponsorship counts.

## States

`idle | loading | loaded { summary } | forbidden | failed { status, reasons, canRetry }`

## Contract

```typescript
createWebFinancialsDashboardUi({ financialsClient })
  .getInitialState()         → idle
  .loadFinancials(shelterId) → loaded | forbidden | failed
```

- No `empty` state — a shelter with no transactions still returns a valid zero summary
- PT-PT content, status: product-flow-ready
- `unsafeReasonMarkers` + `sanitizeReasons` on failed state

## Affected files

- `apps/web/src/financials.ts`
- `apps/web/src/foundation.ts` — financialsDashboard entry
- `tests/web/financials-dashboard-ui.test.ts`
