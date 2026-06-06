# Work Track: Remake Foundation

## Goal

Create the Pic4Paws V2 architecture foundation before continuing implementation.

## Initial Milestones

1. Create and approve `docs/canonical/architecture-proposal.md`. Completed.
2. Create and approve `docs/canonical/sdd.md`. Completed.
3. Bootstrap or revise the codebase according to the approved architecture. Completed.
4. Define pet, shelter, adoption, sponsorship and payment database contracts. Completed through `DB-001`.
5. Rebuild features through strict TDD cycles. In progress.

## Current Focus

`AUTH-SUPABASE-001`, `SEC-001`, `WORKER-SUPABASE-WIRING-001`, `WORKER-SUPABASE-SDK-001`, `R2-SIGNER-SDK-001`, `MEDIA-WORKER-PERSIST-001`, `MEDIA-UPLOAD-CLIENT-001`, `MEDIA-UPLOAD-BINARY-CLIENT-001`, `MEDIA-UPLOAD-FLOW-CLIENT-001`, `WEB-MEDIA-UPLOAD-001`, `MOBILE-MEDIA-UPLOAD-001`, `PET-MEDIA-UPLOAD-UI-001`, `PET-MEDIA-ATTACH-WORKER-001` and `PET-MEDIA-ATTACH-CLIENT-001` are completed or ready for review on their work branches.

Recommended next foundation item: `PET-MEDIA-UPLOAD-ATTACH-FLOW-001`.

Compose upload and attach into one Web/Mobile-safe pet media flow that uploads a public pet image and then attaches the persisted media asset to the draft through injected clients, preserving safe failure phases.
