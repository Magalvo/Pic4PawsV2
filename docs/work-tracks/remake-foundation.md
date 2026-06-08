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

Adoption status management — `PATCH /adoptions/:applicationId` (Worker only so far):
`ADOPTION-STATUS-WORKER-001`.

## Current Focus

`ADOPTION-STATUS-WORKER-001` is merged (PR #76). Shelter admins can now move adoption
applications through the review lifecycle: `submitted → under_review → more_info_requested
→ approved / rejected`. The `PATCH /adoptions/:applicationId` route is shelter-only (no
dual access), with the same `matchWorkerAdoptionStatusId` path-matcher pattern as manage routes.

The foundation now covers all write paths, all public read paths, all shelter-side list
views (adoption, donation, sponsorship), the donor-facing sponsorship list, and the full
sponsorship lifecycle including adoption status management at the Worker level.

Suggested next:
1. Complete adoption status slice: `ADOPTION-STATUS-CLIENT-001` + `WEB-ADOPTION-STATUS-001` + `MOBILE-ADOPTION-STATUS-001`.
2. Or begin a new domain slice (shelter member management, notifications, pet status transitions).

## Branching Convention

The default is **one branch per work item** (`agent/<WORK-ITEM-ID>`). See `AGENTS.md` §Git Workflow for the full rule and the narrow batch-branch exception.
