---
id: FINANCIALS-WORKER-001
title: Payment reconciliation Worker route
status: in-progress
---

## Goal

Expose `GET /shelters/:shelterId/financials` for shelter staff to retrieve an aggregated
financial summary: donation totals by status, and active/paused/cancelled sponsorship counts
with total committed amount.

## Route

`GET /shelters/:shelterId/financials`
- Authenticated (Bearer token)
- Shelter membership required (`canManageShelter`)
- No pagination — returns a single summary object

## Response

```json
{
  "status": "ok",
  "shelterId": "uuid",
  "currency": "EUR",
  "donations": {
    "count": 25,
    "paidTotalCents": 125000,
    "byStatus": [
      { "status": "paid", "count": 12, "totalCents": 120000 },
      { "status": "pending_payment", "count": 3, "totalCents": 15000 }
    ]
  },
  "sponsorships": {
    "activeCount": 5,
    "pausedCount": 2,
    "cancelledCount": 10,
    "activeTotalCents": 25000
  }
}
```

## Design

- `FinancialsRepository.getFinancials(shelterId)` — single method interface
- Supabase impl fetches `donation_transactions` (status, amount_cents, currency) and
  `sponsorships` (status, amount_cents) for the shelter and aggregates in TypeScript
- `currency` is derived from the first donation/sponsorship row, defaults to `'EUR'`
- Path matcher: `matchWorkerFinancialsShelterId(pathname, shelterPath)` — matches
  `{shelterPath}/{shelterId}/financials`, rejects extra segments
- Route registered BEFORE `matchWorkerShelterProfileId` in `index.ts`
- `WORKER_FINANCIALS_PATH` config key NOT needed — route lives under existing `shelterPath`

## Affected files

- `apps/workers/src/financials.ts` — types, interface, path matcher, handler
- `apps/workers/src/financials-supabase.ts` — Supabase aggregation impl
- `apps/workers/src/dependencies.ts` — add `financialsRepository` field
- `apps/workers/src/index.ts` — register route, barrel-export types
- `tests/workers/financials-worker.test.ts` — path matcher + handler tests
- `tests/workers/financials-supabase.test.ts` — Supabase impl tests
