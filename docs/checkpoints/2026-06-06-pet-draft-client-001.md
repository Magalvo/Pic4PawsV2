# Checkpoint: PET-DRAFT-CLIENT-001

Date: 2026-06-06
Branch: `codex/PET-DRAFT-CLIENT-001`
Base: `main` commit `13226b3`

## Summary

Implemented the shared Web/Mobile-safe client for authenticated pet draft create/update Worker routes.

## Completed

- Added `docs/work-items/PET-DRAFT-CLIENT-001-web-mobile-pet-draft-client.md`.
- Added `docs/work-specs/PET-DRAFT-CLIENT-001-web-mobile-pet-draft-client.md`.
- Added `createPetDraftClient` to `packages/client/src/index.ts`.
- Added typed draft input, success, failure status and result models.
- The client calls `POST /pets/drafts` and `PATCH /pets/drafts/:petId` with injected `fetch` and bearer token provider.
- Missing bearer tokens return `unauthenticated` before network calls.
- Draft requests send only the Worker-safe draft payload and avoid client-only status/publish/credential fields.
- Worker successes return safe `petId` metadata.
- Worker failures and malformed responses are normalized to safe client results.
- Failure reasons are sanitized to avoid bearer token, Supabase service-role or R2 credential leakage.
- Added tests in `tests/client/pet-draft-client.test.ts`.
- Updated `docs/work-tracks/remake-foundation.md` and `docs/codex-resume.md`.

## Validation

- Targeted Vitest run passed for the pet draft client.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed.
- `npm run build` passed.

## Current State

The Worker owns draft persistence validation, and Web/Mobile now have a shared safe client for creating and updating pet drafts through authenticated Worker routes without forwarding client-only claims or credential-like fields.

## Recommended Next Work Item

Recommended next item: `WEB-PET-DRAFT-001`.

Goal: wire the shared pet draft client into the Web product boundary/view model with fake/injected dependencies first, exposing safe PT-PT create/update draft states while keeping persistence validation on the Worker.
