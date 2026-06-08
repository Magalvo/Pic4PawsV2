# Work-Item: DONATION-LIST-CLIENT-001 — Donation List Client

## 1. Context & Problem

`DONATION-LIST-WORKER-001` (merged) exposes `GET /shelters/:shelterId/donations`.
No platform-neutral client exists — Web and Mobile cannot fetch the shelter donation list.

## 2. Acceptance Criteria

- [ ] Append to `packages/client/src/index.ts` (after Donation Client section):
  - `DonationClientStatus` type: `'created' | 'pending_payment' | 'paid' | 'failed' |
    'cancelled' | 'refunded' | 'partially_refunded'`
  - `DonationListApplication` type: `donationId`, `kind` (`DonationClientKind`),
    `status` (`DonationClientStatus`), `amountCents`, `currency`,
    `paymentMethod` (`DonationClientPaymentMethod`), `anonymous`, `donorDisplayName: string | null`,
    `publicMessage: string | null`, `createdAt`
  - `DonationListQuery`: `{ limit?: number | null; offset?: number | null }`
  - `DonationListClientSuccess`: `{ ok: true; status: 'ok'; donations: DonationListApplication[]; total: number }`
  - `DonationListClientFailureStatus`: `unauthenticated | forbidden |
    donation_list_repository_not_configured | auth_adapter_not_configured |
    worker_request_failed | worker_response_invalid`
  - `DonationListClientFailure`, `DonationListClientResult`, `CreateDonationListClientInput`,
    `DonationListClient` types
  - `createDonationListClient({ workerBaseUrl, shelterPath, getAccessToken, fetch })`:
    - `loadDonations(shelterId, query?)` → `DonationListClientResult`
    - URL: `{workerBaseUrl}{shelterPath}/{shelterId}/donations`
    - no token → `unauthenticated`
    - GET with Authorization Bearer
    - fetch throws → `worker_request_failed` + `network_error`
    - non-ok HTTP → `parseDonationListFailureStatus` + `sanitizeReasons`
    - 200 but invalid body → `worker_response_invalid`
    - valid → `DonationListClientSuccess`
  - Credential markers sanitized in all failure reasons.
- [ ] Tests use injected fake `fetch` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Web/Mobile donation list boundaries (`WEB-DONATION-LIST-001`,
  `MOBILE-DONATION-LIST-001`).

## 4. Completion Notes

_To be filled in after implementation._
