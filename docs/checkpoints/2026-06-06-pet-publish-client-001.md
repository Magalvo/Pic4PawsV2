# Checkpoint: PET-PUBLISH-CLIENT-001

Date: 2026-06-06
Branch: `codex/PET-PUBLISH-CLIENT-001`
Base: stacked on `codex/MOBILE-PET-MEDIA-UPLOAD-ATTACH-001` commit `4bf44f4`

## Summary

Implemented the shared Web/Mobile-safe client for the authenticated pet draft publish Worker route.

## Completed

- Added `docs/work-items/PET-PUBLISH-CLIENT-001-web-mobile-pet-publish-client.md`.
- Added `docs/work-specs/PET-PUBLISH-CLIENT-001-web-mobile-pet-publish-client.md`.
- Added `createPetPublishClient` to `packages/client/src/index.ts`.
- Added typed publish request, success, failure status and result models.
- The client calls `POST /pets/drafts/:petId/publish` with injected `fetch` and bearer token provider.
- Missing bearer tokens return `unauthenticated` before network calls.
- Publish requests send an empty JSON body only, avoiding client-side publish claims.
- Worker success returns safe `petId` and `publishedAt` metadata.
- Worker failures and malformed responses are normalized to safe client results.
- Failure reasons are sanitized to avoid bearer token, Supabase service-role or R2 credential leakage.
- Added tests in `tests/client/pet-publish-client.test.ts`.
- Updated `docs/work-tracks/remake-foundation.md` and `docs/codex-resume.md`.

## Validation

- Targeted Vitest run passed for the pet publish client.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed.
- `npm run build` passed.

## Current State

The Worker owns pet draft publish authority, and Web/Mobile now have a shared safe client for invoking that server-side publish route without sending media, shelter verification, pet status or permission claims from the client.

## Recommended Next Work Item

Recommended next item: `WEB-PET-PUBLISH-001`.

Goal: wire the shared pet publish client into the Web product boundary/view model with fake/injected dependencies first, exposing safe PT-PT publish states while keeping publish authority on the Worker.
