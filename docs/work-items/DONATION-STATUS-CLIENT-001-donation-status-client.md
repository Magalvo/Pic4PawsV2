# Work-Item: DONATION-STATUS-CLIENT-001 — Donation Status Client

## 1. Context & Problem

`DONATION-STATUS-WORKER-001` (merged, PR #56) exposes `GET /donations/:donationId`
for donor status polling. No client exists to call this route from Web or Mobile.

## 2. Acceptance Criteria

- [ ] Append to `packages/client/src/index.ts` a `// ─── Donation Status Client ───` section:
  - `DonationStatusClientItem` type: `{ donationId, kind, donationStatus, amountCents, currency, paymentMethod, shelterId, petId, createdAt }`.
    Reuses `DonationClientKind`, `DonationClientStatus`, `DonationClientPaymentMethod`.
  - `DonationStatusClientSuccess`: `{ ok: true; status: 'ok'; donation: DonationStatusClientItem }`.
  - `DonationStatusClientFailureStatus`: `unauthenticated | forbidden | donation_not_found | donation_status_repository_not_configured | auth_adapter_not_configured | worker_request_failed | worker_response_invalid`.
  - `DonationStatusClientFailure`, `DonationStatusClientResult` union.
  - `CreateDonationStatusClientInput`: `{ workerBaseUrl, donationsPath: \`/${string}\`, getAccessToken, fetch }`.
  - `DonationStatusClient`: `{ loadDonationStatus(donationId): Promise<DonationStatusClientResult> }`.
  - `createDonationStatusClient(input): DonationStatusClient`:
    - No token → `unauthenticated`.
    - GET `createWorkerSubUrl(workerBaseUrl, donationsPath, donationId)` with Bearer header.
    - fetch throws → `worker_request_failed` + `network_error`.
    - non-ok → `parseDonationStatusFailureStatus` + `sanitizeReasons`.
    - ok but invalid shape → `worker_response_invalid`.
    - valid → `DonationStatusClientSuccess`.
- [ ] Tests: `tests/client/donation-status-client.test.ts` (≥ 10 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No Web/Mobile UI boundary in this item (`WEB-DONATION-STATUS-001`, `MOBILE-DONATION-STATUS-001`).

## 4. Completion Notes

- Appended `// ─── Donation Status Client ───` section to `packages/client/src/index.ts`:
  `DonationStatusClientItem`, `DonationStatusClientSuccess`, `DonationStatusClientFailureStatus`,
  `DonationStatusClientFailure`, `DonationStatusClientResult`, `CreateDonationStatusClientInput`,
  `DonationStatusClient`, `parseDonationStatusSuccess`, `parseDonationStatusFailureStatus`,
  `createDonationStatusClient`.
- 10 tests in `tests/client/donation-status-client.test.ts`. 548/548 total.
- PR #57: https://github.com/Magalvo/Pic4PawsV2/pull/57
