# Checkpoint: MOBILE-PET-PUBLISH-001

Date: 2026-06-06
Branch: `codex/MOBILE-PET-PUBLISH-001`
Base: `main` commit `f0a2c31`

## Summary

Implemented the Mobile product boundary for publishing pet drafts through the shared safe pet publish client.

## Completed

- Added `docs/work-items/MOBILE-PET-PUBLISH-001-mobile-pet-publish-product-flow.md`.
- Added `docs/work-specs/MOBILE-PET-PUBLISH-001-mobile-pet-publish-product-flow.md`.
- Added `apps/mobile/src/pet-publish.ts`.
- Added `createMobilePetPublishUi` with injected `publishClient.publishPetDraft`.
- The Mobile boundary calls publish with only the pet draft ID.
- Success returns safe PT-PT copy plus `petId`, `petName` and `publishedAt`.
- Known publish failures map to distinct safe PT-PT Mobile product states.
- Failure reasons are sanitized to avoid bearer token, Supabase service-role or R2 credential leakage.
- Mobile foundation content now surfaces `petPublish`.
- Added tests in `tests/mobile/pet-publish-ui.test.ts`.
- Updated `docs/work-tracks/remake-foundation.md` and `docs/codex-resume.md`.

## Validation

- Targeted Vitest run passed for Mobile pet publish UI and Mobile foundation content.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed.
- `npm run build` passed.

## Current State

The Worker owns pet draft publish authority, the shared client safely invokes that route, and both Web and Mobile product boundaries now expose safe PT-PT publish states without sending client-side publish claims.

## Recommended Next Work Item

Recommended next item: `PET-DRAFT-CLIENT-001`.

Goal: add a Web/Mobile-safe client for the authenticated pet draft create/update Worker routes with injected `fetch` and bearer token provider, preserving server-side validation and safe failure normalization.
