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

## Current Focus

The full sponsorship list slice is merged (PRs #64–#67). Shelter admins can view all recurring
sponsorships for their shelter. All 6 states (idle/loading/loaded/empty/forbidden/failed) with
PT-PT copy, dedicated `forbidden` state, and credential-sanitized failure reasons in both
Web and Mobile boundaries.

The foundation now covers all write paths, all public read paths, and all shelter-side list
views (adoption, donation, sponsorship).

Suggested next:

1. `SPONSORSHIP-MANAGE-WORKER-001` — `PATCH /sponsorships/:sponsorshipId` cancel/pause/resume
2. Or begin a new domain slice (shelter member management, notifications, pet status transitions)

## Branching Convention

The default is **one branch per work item** (`agent/<WORK-ITEM-ID>`). See `AGENTS.md` §Git Workflow for the full rule and the narrow batch-branch exception.
