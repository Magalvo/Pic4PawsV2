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

`AUTH-SUPABASE-001`, `SEC-001`, `WORKER-SUPABASE-WIRING-001`, `WORKER-SUPABASE-SDK-001`, `R2-SIGNER-SDK-001`, `MEDIA-WORKER-PERSIST-001`, `MEDIA-UPLOAD-CLIENT-001`, `MEDIA-UPLOAD-BINARY-CLIENT-001`, `MEDIA-UPLOAD-FLOW-CLIENT-001`, `WEB-MEDIA-UPLOAD-001`, `MOBILE-MEDIA-UPLOAD-001` and `PET-MEDIA-UPLOAD-UI-001` are completed or ready for review on their work branches.

Recommended next foundation item: `PET-MEDIA-ATTACH-WORKER-001`.

Create an authenticated Worker boundary to attach a persisted public image media asset to a pet draft after upload, reusing the existing domain `attachMediaAssetToPetDraft` rules and keeping Supabase calls injected in tests.
