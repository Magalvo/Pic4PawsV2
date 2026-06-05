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

`AUTH-SUPABASE-001`, `SEC-001`, `WORKER-SUPABASE-WIRING-001`, `WORKER-SUPABASE-SDK-001`, `R2-SIGNER-SDK-001`, `MEDIA-WORKER-PERSIST-001`, `MEDIA-UPLOAD-CLIENT-001`, `MEDIA-UPLOAD-BINARY-CLIENT-001`, `MEDIA-UPLOAD-FLOW-CLIENT-001` and `WEB-MEDIA-UPLOAD-001` are completed or ready for review on their work branches.

Recommended next foundation item: `MOBILE-MEDIA-UPLOAD-001`.

Integrate the composed media upload flow into the Portuguese-first Mobile foundation behind injected/fake dependencies, mirroring the Web boundary before real user-facing media screens or production credentials are connected.
