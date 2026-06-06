# Codex Resume Guide

Use this guide when continuing Pic4Paws V2 from another computer or another Codex thread.

## 1. Fresh Machine Setup

1. Clone or pull the repository.
2. Ensure Node/npm versions are compatible with `package.json`:
   - package manager: `npm@10.9.2`
   - TypeScript monorepo with npm workspaces and Turborepo
3. Install dependencies:
   - `npm ci`
4. Create local environment file:
   - copy `.env.example` to `.env`
   - replace placeholders with local/dev-only credentials
   - do not commit `.env`

## 2. Context Files To Read First

Read these files before implementing new work:

- `AGENTS.md`
- `docs/Project_Constitution.md`
- `docs/canonical/architecture-proposal.md`
- `docs/canonical/sdd.md`
- `docs/work-tracks/remake-foundation.md`
- latest file in `docs/checkpoints/`

The legacy app under `reference/` is functional reference only. Do not copy its architecture, tech stack, UI stack or design patterns into V2.

## 3. Required Working Method

Do not work directly on `main`.

For each new work item:

1. `git switch main`
2. `git pull --ff-only origin main`
3. `git switch -c codex/<WORK-ITEM-ID>`
4. create or update the work item in `docs/work-items/`
5. create or update the work spec in `docs/work-specs/`
6. write the failing test first
7. implement the smallest change that passes
8. run validation
9. commit one coherent checkpoint
10. push branch and open PR

Required validation:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 4. Current State As Of 2026-06-06

Merged through `main` commit `0120361` before `PET-MEDIA-ATTACH-CLIENT-001`.

Completed foundation work:

- `AUTH-SUPABASE-001`
- `SEC-001`
- `WORKER-SUPABASE-WIRING-001`
- `WORKER-SUPABASE-SDK-001`
- `R2-SIGNER-SDK-001`
- `MEDIA-WORKER-PERSIST-001`
- `MEDIA-UPLOAD-CLIENT-001` on branch `codex/MEDIA-UPLOAD-CLIENT-001`
- `MEDIA-UPLOAD-BINARY-CLIENT-001` on branch `codex/MEDIA-UPLOAD-BINARY-CLIENT-001`
- `MEDIA-UPLOAD-FLOW-CLIENT-001` on branch `codex/MEDIA-UPLOAD-FLOW-CLIENT-001`
- `WEB-MEDIA-UPLOAD-001` on branch `codex/WEB-MEDIA-UPLOAD-001`
- `MOBILE-MEDIA-UPLOAD-001` on branch `codex/MOBILE-MEDIA-UPLOAD-001`
- `PET-MEDIA-UPLOAD-UI-001` on branch `codex/PET-MEDIA-UPLOAD-UI-001`, stacked on `codex/MOBILE-MEDIA-UPLOAD-001`
- `PET-MEDIA-ATTACH-WORKER-001` on branch `codex/PET-MEDIA-ATTACH-WORKER-001`
- `PET-MEDIA-ATTACH-CLIENT-001` on branch `codex/PET-MEDIA-ATTACH-CLIENT-001`

The Worker now has:

- server-side Supabase SDK dependency composition
- server-side R2/S3-compatible upload signer factory
- authenticated media upload persistence for signed intents
- authenticated pet media attachment for persisted public image assets
- tests that keep Supabase and Cloudflare calls mocked/injected

Web/Mobile now has:

- a platform-neutral `@pic4paws/client` package
- a tested media upload intent client with injected `fetch` and bearer token provider
- a tested signed URL binary upload executor with injected `fetch`
- a tested composed media upload flow client with distinct intent and binary upload failure phases
- a tested pet media attach client for the authenticated Worker route with injected `fetch` and bearer token provider
- a tested Web media upload boundary for public pet images with PT-PT states and injected dependencies
- a tested Mobile media upload boundary for public pet images with PT-PT states and injected dependencies
- tested Web and Mobile pet media product UI flows with deterministic media IDs, MIME guards and safe PT-PT view models
- safe Worker success/failure normalization
- no client-side Supabase service-role keys or R2 credentials

## 5. Recommended Next Work Item

Recommended next item: `PET-MEDIA-UPLOAD-ATTACH-FLOW-001`.

Goal: compose upload and attach into one Web/Mobile-safe pet media flow.

Suggested scope:

- create work item and work spec
- create work item and work spec
- add a composed product/client flow that uploads a public pet image and then calls `attachPetMedia`
- keep upload boundary/client, attach client, file input and ID generation injectable in tests
- expose failure phases for upload intent, binary upload and draft attach
- assert attach is not attempted when upload fails
- assert results never expose signed URLs, Supabase service-role keys, R2 keys or bearer tokens
- do not wire real Web/Mobile UI or production sessions yet

## 6. Handoff Prompt For Codex

Use this prompt in a new Codex thread:

```text
Read AGENTS.md, docs/codex-resume.md, docs/work-tracks/remake-foundation.md and the latest docs/checkpoints file. Continue Pic4Paws V2 from main using strict SDD/TDD. Do not work on main. Start the next recommended work item unless I specify another one.
```
