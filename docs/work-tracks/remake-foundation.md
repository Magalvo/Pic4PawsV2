# Work Track: Remake Foundation

## Goal

Create the Pic4Paws V2 architecture foundation before continuing implementation.

## Initial Milestones

1. Create and approve `docs/canonical/architecture-proposal.md`. Completed.
2. Create and approve `docs/canonical/sdd.md`. Completed.
3. Bootstrap or revise the codebase according to the approved architecture. Completed.
4. Define pet, shelter, adoption, sponsorship and payment database contracts. Completed through `DB-001`.
5. Rebuild features through strict TDD cycles. In progress.

## Completed Items (all merged to `main`)

Write path (Worker + client + Web/Mobile):
`AUTH-SUPABASE-001`, `SEC-001`, `WORKER-SUPABASE-WIRING-001`, `WORKER-SUPABASE-SDK-001`,
`R2-SIGNER-SDK-001`, `MEDIA-WORKER-PERSIST-001`,
`MEDIA-UPLOAD-CLIENT-001`, `MEDIA-UPLOAD-BINARY-CLIENT-001`, `MEDIA-UPLOAD-FLOW-CLIENT-001`,
`WEB-MEDIA-UPLOAD-001`, `MOBILE-MEDIA-UPLOAD-001`, `PET-MEDIA-UPLOAD-UI-001`,
`PET-MEDIA-ATTACH-WORKER-001`, `PET-MEDIA-ATTACH-CLIENT-001`, `PET-MEDIA-UPLOAD-ATTACH-FLOW-001`,
`WEB-PET-MEDIA-UPLOAD-ATTACH-001`, `MOBILE-PET-MEDIA-UPLOAD-ATTACH-001`,
`PET-PUBLISH-CLIENT-001`, `WEB-PET-PUBLISH-001`, `MOBILE-PET-PUBLISH-001`,
`PET-DRAFT-CLIENT-001`, `WEB-PET-DRAFT-001`, `MOBILE-PET-DRAFT-001`,
`PET-DRAFT-SAVE-FLOW-CLIENT-001`, `WEB-PET-DRAFT-SAVE-FLOW-001`, `MOBILE-PET-DRAFT-SAVE-FLOW-001`.

Read path (Worker + client + Web/Mobile):
`PET-FEED-WORKER-001`, `PET-FEED-CLIENT-001`, `WEB-PET-FEED-001`, `MOBILE-PET-FEED-001`,
`PET-PROFILE-WORKER-001`, `PET-PROFILE-CLIENT-001`, `WEB-PET-PROFILE-001`, `MOBILE-PET-PROFILE-001`,
`SHELTER-PROFILE-WORKER-001`, `SHELTER-PROFILE-CLIENT-001`, `WEB-SHELTER-PROFILE-001`, `MOBILE-SHELTER-PROFILE-001`.

Adopter write path (Worker + client + Web/Mobile):
`ADOPTION-WORKER-001`, `ADOPTION-CLIENT-001`, `WEB-ADOPTION-001`, `MOBILE-ADOPTION-001`.

Shelter-side adoption review (Worker + client + Web/Mobile):
`ADOPTION-LIST-WORKER-001`, `ADOPTION-LIST-CLIENT-001`, `WEB-ADOPTION-LIST-001`, `MOBILE-ADOPTION-LIST-001`.

Donation slice (Worker + client + Web/Mobile):
`DONATION-WORKER-001`, `DONATION-CLIENT-001`, `WEB-DONATION-001`, `MOBILE-DONATION-001`.

Shelter-side donation list (Worker + client + Web/Mobile):
`DONATION-LIST-WORKER-001`, `DONATION-LIST-CLIENT-001`, `WEB-DONATION-LIST-001`, `MOBILE-DONATION-LIST-001`.

Payment confirmation + donor status polling (Worker + client + Web/Mobile):
`PAYMENT-WEBHOOK-WORKER-001`, `DONATION-STATUS-WORKER-001`, `DONATION-STATUS-CLIENT-001`,
`WEB-DONATION-STATUS-001`, `MOBILE-DONATION-STATUS-001`.

Recurring sponsorship — padrinhos (Worker + client + Web/Mobile):
`SPONSORSHIP-WORKER-001`, `SPONSORSHIP-CLIENT-001`, `WEB-SPONSORSHIP-001`, `MOBILE-SPONSORSHIP-001`.

Shelter-side sponsorship list (Worker + client + Web/Mobile):
`SPONSORSHIP-LIST-WORKER-001`, `SPONSORSHIP-LIST-CLIENT-001`, `WEB-SPONSORSHIP-LIST-001`, `MOBILE-SPONSORSHIP-LIST-001`.

Sponsorship lifecycle management — cancel/pause/resume (Worker + client + Web/Mobile):
`SPONSORSHIP-MANAGE-WORKER-001`, `SPONSORSHIP-MANAGE-CLIENT-001`, `WEB-SPONSORSHIP-MANAGE-001`, `MOBILE-SPONSORSHIP-MANAGE-001`.

Donor-facing sponsorship list — `GET /sponsorships` (Worker + client + Web/Mobile):
`SPONSORSHIP-DONOR-LIST-WORKER-001`, `SPONSORSHIP-DONOR-LIST-CLIENT-001`, `WEB-SPONSORSHIP-DONOR-LIST-001`, `MOBILE-SPONSORSHIP-DONOR-LIST-001`.

Adoption status management — full slice (Worker + client + Web/Mobile):
`ADOPTION-STATUS-WORKER-001`, `ADOPTION-STATUS-CLIENT-001`, `WEB-ADOPTION-STATUS-001`, `MOBILE-ADOPTION-STATUS-001`.

Adoption view — full slice (Worker + client + Web/Mobile):
`ADOPTION-VIEW-WORKER-001`, `ADOPTION-VIEW-CLIENT-001`, `WEB-ADOPTION-VIEW-001`, `MOBILE-ADOPTION-VIEW-001`.

Shelter member management — full slice (Worker + client + Web/Mobile, first 8-state combined read+write boundary):
`SHELTER-MEMBER-WORKER-001`, `SHELTER-MEMBER-CLIENT-001`, `WEB-SHELTER-MEMBER-001`, `MOBILE-SHELTER-MEMBER-001`.

Notification + shelter-search + notification-preferences slices (PRs #89–#108):
`NOTIFICATION-WORKER-001`, `NOTIFICATION-CLIENT-001`, `WEB-NOTIFICATION-001`, `MOBILE-NOTIFICATION-001`,
`DONOR-ADOPTION-LIST-WORKER-001`, `DONOR-ADOPTION-LIST-CLIENT-001`, `WEB-DONOR-ADOPTION-LIST-001`, `MOBILE-DONOR-ADOPTION-LIST-001`,
`PET-REPUBLISH-WORKER-001`, `PET-REPUBLISH-CLIENT-001`, `WEB-PET-REPUBLISH-001`, `MOBILE-PET-REPUBLISH-001`,
`SHELTER-SEARCH-WORKER-001`, `SHELTER-SEARCH-CLIENT-001`, `WEB-SHELTER-SEARCH-001`, `MOBILE-SHELTER-SEARCH-001`,
`NOTIF-PREFS-WORKER-001`, `NOTIF-PREFS-CLIENT-001`, `WEB-NOTIF-PREFS-001`, `MOBILE-NOTIF-PREFS-001`,
`NOTIF-PREFS-DISPATCH-001`.

Financials + pet status history slices (PRs #110–#121):
`FINANCIALS-WORKER-001`, `FINANCIALS-CLIENT-001`, `WEB-FINANCIALS-001`, `MOBILE-FINANCIALS-001`,
`PET-STATUS-HISTORY-001`, `PET-STATUS-HISTORY-READ-001`, `PET-STATUS-HISTORY-CLIENT-001`,
`WEB-PET-STATUS-HISTORY-001`, `MOBILE-PET-STATUS-HISTORY-001`.

Worker error boundary + shelter-side pet list + pet draft load + pet feed filters + shelter registration + shelter update + atomic registration (PRs #122–#136):
`WORKER-ERROR-BOUNDARY-001`, `SHELTER-PETS-WORKER-001`, `SHELTER-PETS-CLIENT-001`,
`WEB-SHELTER-PETS-001`, `MOBILE-SHELTER-PETS-001`, `PET-DRAFT-LOAD-WORKER-001`,
`PET-DRAFT-LOAD-CLIENT-001`, `WEB-PET-DRAFT-LOAD-001`, `MOBILE-PET-DRAFT-LOAD-001`,
`PET-FEED-FILTERS-001`, `SHELTER-REGISTER-WORKER-001`, `SHELTER-REGISTER-CLIENT-001`,
`WEB-SHELTER-REGISTER-001`, `MOBILE-SHELTER-REGISTER-001`, `SHELTER-UPDATE-001`,
`SHELTER-REGISTER-ATOMIC-001`.

Shelter deletion + audit remediation (PRs #137–#138, remediation in progress):
`SHELTER-DELETE-001` — `DELETE /shelters/:shelterId`; owner-only soft-delete; join-filter
cascade (pets hidden from feed without pet row changes); 4-layer slice.

Audit remediation (audit-remediation-2026-06-13 branch):
- D3+D4 fixes: pet profile and pet feed both filter by `shelters.deleted_at IS NULL` AND `shelters.verification_status = 'verified'`.
- D6 fix: `actorUserId` removed from `ShelterDeletionRepository` contract.
- Work items created: `SHELTER-REGISTER-RPC-HARDEN-001`, `SHELTER-PROFILE-VISIBILITY-001`, `WORKER-DISPATCH-MODULAR-001`.

Security hardening + visibility gate (PRs #139–#143, #146):
`SHELTER-REGISTER-RPC-HARDEN-001`, `SHELTER-PROFILE-VISIBILITY-001`.
Audit remediation E1-E4: shelter-delete error sanitization, test bearer pattern, docs drift.

Post-audit security hardening (PRs #149–#156):
`DB-SHELTER-GEO-001`, `SDD-WORKITEM-HYGIENE-001`, `DOMAIN-CANON-001`, `RLS-002`,
`MEDIA-UPLOAD-AUTH-001`, `DONATION-ELIGIBILITY-001`, `PAYMENT-WEBHOOK-002`, `PAYMENT-WEBHOOK-VERIFIER-001`.

Dispatcher + client modularization (PR #147):
`WORKER-DISPATCH-MODULAR-001` — 8 per-domain route modules under `apps/workers/src/routes/`;
8 per-domain client modules under `packages/client/src/`; route-table test enforces ordering.

Eupago multi-provider payment support (PRs #276–#280, PR #281 in review):
`EUPAGO-DB-001` — `shelter_active_provider` enum + encrypted credential columns on `shelter_payment_configs`
`EUPAGO-CONFIG-WORKER-001` — `activeProvider` in `GET/PATCH /shelters/:id/payment-config`; AES-256-GCM credential encryption
`EUPAGO-WEBHOOK-001` — isolated per-provider webhook endpoints (`/webhooks/payments/eupago`, `/webhooks/payments/ifthenpay`); per-shelter HMAC verification
`EUPAGO-REFERENCE-FACTORY-001` — `PaymentReferenceFactory` interface; Eupago + Ifthenpay adapters; Supabase factory; automated-tier stub replaced with full PSP flow
`EUPAGO-DONATION-CLIENT-001` (PR #281, in review) — `DonationClientSuccess` discriminated union; `DonationClientPaymentReference` type; `submitted_automated` Web + Mobile state

## Current Focus

**This work track is complete** (pending merge of PR #281).

Main branch HEAD: PR #280 (`EUPAGO-REFERENCE-FACTORY-001`, `16602c4`). Tests: ~2490 on main / 2515 including PR #281.
All validation gates pass.

There are no remaining planned work items in this track. See `docs/agent-resume.md` section 5 for
the next candidate tracks (production readiness gaps, SDD audit).

## Branching Convention

The default is **one branch per work item** (`agent/<WORK-ITEM-ID>`). See `AGENTS.md` §Git Workflow for the full rule and the narrow batch-branch exception.
