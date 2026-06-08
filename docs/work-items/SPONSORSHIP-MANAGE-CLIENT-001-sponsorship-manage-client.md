# Work-Item: SPONSORSHIP-MANAGE-CLIENT-001 — Sponsorship Manage Client

## 1. Context & Problem

`SPONSORSHIP-MANAGE-WORKER-001` (merged, PR #68) exposes `PATCH /sponsorships/:sponsorshipId`.
The `@pic4paws/client` package has no way to call this route. Web and Mobile product boundaries
need a typed, credential-safe manage client.

## 2. Acceptance Criteria

- [ ] Add `// ─── Sponsorship Manage Client ───` section to `packages/client/src/index.ts`:
  - `SponsorshipManageClientInput = { sponsorshipId: string; status: SponsorshipClientStatus }`.
  - `SponsorshipManageClientSuccess = { ok: true; status: 'ok'; sponsorshipId; newStatus: SponsorshipClientStatus }`.
  - `SponsorshipManageClientFailureStatus`: `unauthenticated | forbidden | sponsorship_not_found | invalid_sponsorship_manage | sponsorship_manage_repository_not_configured | auth_adapter_not_configured | worker_request_failed | worker_response_invalid`.
  - `SponsorshipManageClientFailure = { ok: false; status; reasons }`.
  - `SponsorshipManageClientResult = SponsorshipManageClientSuccess | SponsorshipManageClientFailure`.
  - `CreateSponsorshipManageClientInput = { workerBaseUrl; sponsorshipsPath; getAccessToken; fetch }`.
  - `SponsorshipManageClient = { manageSponsorship(sponsorshipId, status): Promise<SponsorshipManageClientResult> }`.
  - `createSponsorshipManageClient(...)` — issues `PATCH {sponsorshipsPath}/{sponsorshipId}` with Bearer.
    - No token → `unauthenticated`.
    - Fetch throws → `worker_request_failed` + `network_error`.
    - Non-ok → parse failure status + `sanitizeReasons`.
    - 200 but invalid shape → `worker_response_invalid`.
    - Valid → `SponsorshipManageClientSuccess`.
- [ ] Tests: `tests/client/sponsorship-manage-client.test.ts` (≥ 10 tests, fail → pass).
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No Worker changes.
- No Web/Mobile UI changes (those are WEB/MOBILE-SPONSORSHIP-MANAGE-001).

## 4. Completion Notes

_To be filled in after implementation._
