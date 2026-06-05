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

`AUTH-SUPABASE-001`, `SEC-001`, `WORKER-SUPABASE-WIRING-001`, `WORKER-SUPABASE-SDK-001`, `R2-SIGNER-SDK-001`, `MEDIA-WORKER-PERSIST-001`, `MEDIA-UPLOAD-CLIENT-001` and `MEDIA-UPLOAD-BINARY-CLIENT-001` are completed or ready for review on their work branches.

Recommended next foundation item: `MEDIA-UPLOAD-FLOW-CLIENT-001`.

Compose the media upload intent request and binary signed URL upload executor into a single Web/Mobile-safe client flow, with injected dependencies and typed partial-failure results, before connecting it to UI.
