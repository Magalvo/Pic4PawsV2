# Work-Item: SPONSORSHIP-CLIENT-001 — Sponsorship Client

## 1. Context & Problem

`SPONSORSHIP-WORKER-001` (merged, PR #60) exposes `POST /sponsorships`.
No client exists to call this route from Web or Mobile.

## 2. Acceptance Criteria

- [ ] Append to `packages/client/src/index.ts` a `// ─── Sponsorship Client ───` section
  (before `// ─── Media Upload Flow Client ───`):
  - `SponsorshipClientRecurringInterval`: `'monthly' | 'quarterly' | 'annual'`.
  - `SponsorshipClientInput`: `{ shelterId, amountCents, paymentMethod, recurringInterval,
    dataProcessingAccepted: true, petId? }`.
    Reuses `DonationClientPaymentMethod`.
  - `SponsorshipClientSuccess`: `{ ok: true; status: 'sponsorship_created'; sponsorshipId;
    amountCents; currency; recurringInterval; shelterId; createdAt }`.
  - `SponsorshipClientFailureStatus`: `unauthenticated | invalid_sponsorship |
    sponsorship_repository_not_configured | auth_adapter_not_configured |
    worker_request_failed | worker_response_invalid`.
  - `SponsorshipClientFailure`, `SponsorshipClientResult` union.
  - `CreateSponsorshipClientInput`: `{ workerBaseUrl, sponsorshipsPath: \`/${string}\`,
    getAccessToken, fetch }`.
  - `SponsorshipClient`: `{ submitSponsorship(input): Promise<SponsorshipClientResult> }`.
  - `createSponsorshipClient(input): SponsorshipClient`:
    - No token → `unauthenticated`.
    - POST `createWorkerUrl(workerBaseUrl, sponsorshipsPath)` with Bearer header + JSON body.
    - fetch throws → `worker_request_failed` + `network_error`.
    - non-ok → `parseSponsorshipFailureStatus` + `sanitizeReasons`.
    - ok but invalid shape → `worker_response_invalid`.
    - valid → `SponsorshipClientSuccess`.
- [ ] Tests: `tests/client/sponsorship-client.test.ts` (≥ 9 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No Web/Mobile UI boundary in this item (`WEB-SPONSORSHIP-001`, `MOBILE-SPONSORSHIP-001`).

## 4. Completion Notes

_To be filled in after implementation._
