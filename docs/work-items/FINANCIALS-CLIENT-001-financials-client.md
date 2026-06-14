---
id: FINANCIALS-CLIENT-001
title: Financials client for payment reconciliation dashboard
status: done
pr: 111
---

## Goal

Add `createFinancialsClient` to `@pic4paws/client` wrapping the authenticated
`GET /shelters/:shelterId/financials` route added in `FINANCIALS-WORKER-001`.

## States

- `idle`: no request has started.
- `loading`: the client is requesting the Worker route.
- `loaded`: the Worker returned a valid financial summary.
- `failed`: authentication, authorization, repository or response validation failed.

## Contract

```typescript
createFinancialsClient({ workerBaseUrl, shelterPath, getAccessToken, fetch })
  .loadFinancials(shelterId) → LoadFinancialsClientResult
```

- URL: `createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'financials')`
- Success: `{ ok: true, summary: FinancialsClientSummary }` with donations byStatus breakdown
  and sponsorship counts + activeTotalCents
- Failure statuses: `unauthenticated | forbidden | financials_repository_not_configured |
  auth_adapter_not_configured | worker_request_failed | worker_response_invalid`

## Affected files

- `packages/client/src/index.ts` — FinancialsClient types + createFinancialsClient
- `tests/client/financials-client.test.ts`
