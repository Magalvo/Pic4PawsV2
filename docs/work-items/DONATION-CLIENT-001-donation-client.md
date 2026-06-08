# Work-Item: DONATION-CLIENT-001 — Donation Client

## 1. Context & Problem

`DONATION-WORKER-001` (merged) exposes `POST /donations` returning
`{ status: 'donation_created', donationId, amountCents, currency, kind, shelterId, createdAt }`.
No platform-neutral client exists — Web and Mobile cannot initiate donations.

## 2. Acceptance Criteria

- [ ] Append to `packages/client/src/index.ts`:
  - `DonationClientKind`, `DonationClientPaymentMethod` types.
  - `DonationClientInput` — `shelterId`, `amountCents`, `kind`, `paymentMethod`,
    `dataProcessingAccepted: true`; optional nullable: `petId`, `publicMessage`,
    `anonymous`, `donorDisplayName`, `donorEmail`.
  - `DonationClientSuccess` — `{ ok: true; status: 'donation_created'; donationId;
    amountCents; currency; kind; shelterId; createdAt }`.
  - `DonationClientFailureStatus` — `unauthenticated | invalid_donation |
    donation_repository_not_configured | auth_adapter_not_configured |
    worker_request_failed | worker_response_invalid`.
  - `DonationClientFailure`, `DonationClientResult`, `CreateDonationClientInput`,
    `DonationClient` types.
  - `createDonationClient({ workerBaseUrl, donationsPath, getAccessToken, fetch })` —
    `submitDonation(input)`:
    - no token → `unauthenticated`
    - `POST {workerBaseUrl}{donationsPath}` with `Authorization: Bearer`
    - fetch throws → `worker_request_failed` + `network_error`
    - non-ok HTTP → `parseDonationFailureStatus` + `sanitizeReasons`
    - 200/201 but invalid body → `worker_response_invalid`
    - valid → `DonationClientSuccess`
  - Credential markers sanitized in all failure `reasons`.
- [ ] Tests use injected fake `fetch` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement Web/Mobile boundaries (`WEB-DONATION-001`, `MOBILE-DONATION-001`).
- Do not integrate a real payment provider.

## 4. Completion Notes

_To be filled in after implementation._
