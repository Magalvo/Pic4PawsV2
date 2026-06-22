# Work-Spec: Implementation Plan for DONATE-CONFIG-CLIENT-001

## 1. Target Files

- `docs/work-items/DONATE-CONFIG-CLIENT-001-shelter-payment-config-client.md`
- `docs/work-specs/DONATE-CONFIG-CLIENT-001-shelter-payment-config-client.md`
- `packages/client/src/shelter-payment-config.ts`
- `packages/client/src/index.ts`
- `tests/client/shelter-payment-config-client.test.ts`

## 2. Proposed Technical Approach

Follow the existing client pattern in `packages/client/src/donations.ts`:

- Use `createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'payment-config')` for
  the sub-path. This helper already exists in `_shared.ts`.
- Parse success/failure using narrow type guards (`parsePaymentConfigSuccess`,
  `parseLoadPaymentConfigSuccess`) modelled on `parseDonationSuccess`.
- Map server status strings to typed client failure statuses with a fallback of
  `'worker_request_failed'`.

The two factories share the same constructor signature shape as `createDonationListClient`.
They differ only in the HTTP method and response parsing.

## 3. Testing Strategy

`tests/client/shelter-payment-config-client.test.ts` — fake fetch returning stubbed responses.

- `savePaymentConfig`: missing access token → `unauthenticated`; server returns 400 →
  `invalid_config`; server returns 200 → parsed `payment_config_saved`.
- `loadPaymentConfig`: missing token → `unauthenticated`; server returns 200 with
  `configured: false` → `ok` with null fields; server returns 200 with config → `ok` with
  iban + mbWayPhone.

## 4. Validation Commands

```
npx tsc --noEmit -p tests/tsconfig.json
npm run typecheck
npm run lint
npm run test
npm run build
```

## 5. Risk Controls

- `iban` must never be logged or included in error `reasons` arrays.
- Client must not perform IBAN validation — all validation is server-side.
