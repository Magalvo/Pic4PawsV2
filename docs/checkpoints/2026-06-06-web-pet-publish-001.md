# Checkpoint: WEB-PET-PUBLISH-001

Date: 2026-06-06
Branch: `codex/WEB-PET-PUBLISH-001`
Base: `main` commit `6bea5f7`

## Summary

Implemented the Web product boundary for publishing pet drafts through the shared safe pet publish client.

## Completed

- Added `docs/work-items/WEB-PET-PUBLISH-001-web-pet-publish-product-flow.md`.
- Added `docs/work-specs/WEB-PET-PUBLISH-001-web-pet-publish-product-flow.md`.
- Added `apps/web/src/pet-publish.ts`.
- Added `createWebPetPublishUi` with injected `publishClient.publishPetDraft`.
- The Web boundary calls publish with only the pet draft ID.
- Success returns safe PT-PT copy plus `petId`, `petName` and `publishedAt`.
- Known publish failures map to distinct safe PT-PT Web product states.
- Failure reasons are sanitized to avoid bearer token, Supabase service-role or R2 credential leakage.
- Web foundation content now surfaces `petPublish`.
- Added tests in `tests/web/pet-publish-ui.test.ts`.
- Updated `docs/work-tracks/remake-foundation.md` and `docs/codex-resume.md`.

## Validation

- Targeted Vitest run passed for Web pet publish UI and Web foundation content.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed.
- `npm run build` passed.

## Current State

The Worker owns pet draft publish authority, the shared client safely invokes that route, and the Web product boundary now exposes safe PT-PT publish states without sending client-side publish claims.

## Recommended Next Work Item

Recommended next item: `MOBILE-PET-PUBLISH-001`.

Goal: wire the shared pet publish client into the Mobile product boundary/view model with fake/injected dependencies first, mirroring the Web publish flow while keeping publish authority on the Worker.
