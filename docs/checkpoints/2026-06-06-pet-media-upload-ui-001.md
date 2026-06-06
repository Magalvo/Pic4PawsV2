# Checkpoint: PET-MEDIA-UPLOAD-UI-001

Date: 2026-06-06
Branch: `codex/PET-MEDIA-UPLOAD-UI-001`
Base: stacked on `codex/MOBILE-MEDIA-UPLOAD-001`

## Summary

Implemented the first pet-facing media upload product UI flow for Web and Mobile over the existing safe upload boundaries.

## Completed

- Added `docs/work-items/PET-MEDIA-UPLOAD-UI-001-pet-media-product-upload-flow.md`.
- Added `docs/work-specs/PET-MEDIA-UPLOAD-UI-001-pet-media-product-upload-flow.md`.
- Added `apps/web/src/pet-media-upload.ts`.
- Added `apps/mobile/src/pet-media-upload.ts`.
- Added Web and Mobile tests for:
  - PT-PT ready/product copy
  - deterministic media ID generation
  - upload boundary calls with pet draft shelter scope
  - unsupported MIME rejection before boundary calls
  - safe failure mapping without signed URLs or credential markers
- Surfaced `Imagem do animal` as a product-flow-ready capability in Web and Mobile foundation content/screens.

## Validation

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed: 35 test files, 152 tests.
- `npm run build` passed.

## Current State

The upload path now reaches product-level Web/Mobile view models safely. Successful upload returns safe media metadata and the next action `Associar imagem ao rascunho`, but this work item does not persist the media attachment to the pet draft.

## Recommended Next Work Item

Recommended next item: `PET-MEDIA-ATTACH-WORKER-001`.

Goal: create an authenticated Worker boundary to attach a persisted public image media asset to a pet draft after upload, reusing the existing domain `attachMediaAssetToPetDraft` rules with injected repositories in tests.
