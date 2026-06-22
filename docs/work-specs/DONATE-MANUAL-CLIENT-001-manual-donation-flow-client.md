# Work-Spec: Implementation Plan for DONATE-MANUAL-CLIENT-001

## 1. Target Files

- `docs/work-items/DONATE-MANUAL-CLIENT-001-manual-donation-flow-client.md`
- `docs/work-specs/DONATE-MANUAL-CLIENT-001-manual-donation-flow-client.md`
- `packages/client/src/donations.ts`
- `packages/client/src/index.ts`
- `tests/client/donation-manual-client.test.ts`

## 2. Proposed Technical Approach

Extend the existing `packages/client/src/donations.ts` file — do not create a new file.
Both new factories follow the identical shape of `createDonationStatusClient`:
1. Get access token; return `unauthenticated` if missing.
2. Fetch the worker endpoint via PATCH.
3. Parse the JSON response body.
4. Map HTTP status → typed success or failure.

Paths:
- Submit receipt: `PATCH {donationsPath}/{donationId}/receipt`
- Review:         `PATCH {donationsPath}/{donationId}/review`

Use `createWorkerSubUrl` from `_shared.ts` with an extra segment:
```ts
`${createWorkerSubUrl(workerBaseUrl, donationsPath, donationId)}/receipt`
`${createWorkerSubUrl(workerBaseUrl, donationsPath, donationId)}/review`
```

Both operations are idempotent from the client perspective — a network error should be
surfaced as `worker_request_failed` with `canRetry: true` implied by the failure shape.

## 3. Testing Strategy

`tests/client/donation-manual-client.test.ts` — fake fetch.

Submit receipt:
- Missing token → `unauthenticated`.
- Server 401 → `unauthenticated`.
- Server 403 → `forbidden`.
- Server 404 → `donation_not_found`.
- Server 409 → `donation_wrong_state`.
- Server 200 → `receipt_submitted`.

Review:
- Missing token → `unauthenticated`.
- Server 403 → `forbidden`.
- Server 404 → `donation_not_found`.
- Server 409 → `donation_wrong_state`.
- Server 200 with `donation_approved` → parsed success.
- Server 200 with `donation_rejected` → parsed success.

## 4. Validation Commands

```
npx tsc --noEmit -p tests/tsconfig.json
npm run typecheck
npm run lint
npm run test
npm run build
```

## 5. Risk Controls

- Verify that the `status` field in the review response is narrowed to
  `'donation_approved' | 'donation_rejected'` before returning, not left as `string`.
- Do not include `receiptMediaId` in error `reasons` arrays.
