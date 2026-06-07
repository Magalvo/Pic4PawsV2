# Agent Resume Guide

Use this guide when continuing Pic4Paws V2 from another computer or another AI agent session.

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

### Default: one branch per work item

For each new work item:

1. `git switch main`
2. `git pull --ff-only origin main`
3. `git switch -c agent/<WORK-ITEM-ID>`
4. create or update the work item in `docs/work-items/`
5. create or update the work spec in `docs/work-specs/`
6. write the failing test first
7. implement the smallest change that passes
8. run validation
9. commit one coherent checkpoint
10. push branch and open PR

### Exception: batch branch

Use `agent/<FEATURE>-batch` only when all items are **entirely new** (none has production value without the others) and are **tightly coupled by type contract** (e.g. a brand-new Worker route + its client + both boundaries introduced for the first time together). Each work item must still be a separate commit within the batch. This is an exception, not the default.

Do not batch items that can be reviewed or merged independently.

### Required validation before every commit

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 4. Current State As Of 2026-06-07

All foundation work merged into `main`. Latest merged commit is the `agent/PET-FEED-CLIENT-001-batch` PR.

Completed foundation items (all merged to `main`):

- `AUTH-SUPABASE-001`
- `SEC-001`
- `WORKER-SUPABASE-WIRING-001`
- `WORKER-SUPABASE-SDK-001`
- `R2-SIGNER-SDK-001`
- `MEDIA-WORKER-PERSIST-001`
- `MEDIA-UPLOAD-CLIENT-001`
- `MEDIA-UPLOAD-BINARY-CLIENT-001`
- `MEDIA-UPLOAD-FLOW-CLIENT-001`
- `WEB-MEDIA-UPLOAD-001`
- `MOBILE-MEDIA-UPLOAD-001`
- `PET-MEDIA-UPLOAD-UI-001`
- `PET-MEDIA-ATTACH-WORKER-001`
- `PET-MEDIA-ATTACH-CLIENT-001`
- `PET-MEDIA-UPLOAD-ATTACH-FLOW-001`
- `WEB-PET-MEDIA-UPLOAD-ATTACH-001`
- `MOBILE-PET-MEDIA-UPLOAD-ATTACH-001`
- `PET-PUBLISH-CLIENT-001`
- `WEB-PET-PUBLISH-001`
- `MOBILE-PET-PUBLISH-001`
- `PET-DRAFT-CLIENT-001`
- `WEB-PET-DRAFT-001`
- `MOBILE-PET-DRAFT-001`
- `PET-DRAFT-SAVE-FLOW-CLIENT-001`
- `WEB-PET-DRAFT-SAVE-FLOW-001`
- `MOBILE-PET-DRAFT-SAVE-FLOW-001`
- `PET-FEED-WORKER-001` — public `GET /pets` Worker route with pagination
- `PET-FEED-CLIENT-001` — `createPetFeedClient` in `@pic4paws/client`
- `WEB-PET-FEED-001` — Web pet feed product boundary with PT-PT states
- `MOBILE-PET-FEED-001` — Mobile pet feed product boundary with PT-PT states

The Worker now has:

- server-side Supabase SDK dependency composition
- server-side R2/S3-compatible upload signer factory
- authenticated media upload persistence for signed intents
- authenticated pet media attachment for persisted public image assets
- authenticated pet draft create, update, and publish routes
- public paginated pet feed (`GET /pets`) with `PetFeedRepository` interface
- `SupabaseTableQueryLike` supports `.is()`, `.order()`, `.range()`
- tests that keep Supabase and Cloudflare calls mocked/injected

`@pic4paws/client` now has:

- `MediaUploadClient`, `MediaUploadBinaryClient`, `MediaUploadFlowClient`
- `PetMediaAttachClient`, `PetMediaUploadAttachFlowClient`
- `PetPublishClient`
- `PetDraftClient`
- `PetDraftSaveFlowClient` (composed draft save + media upload flow)
- `PetFeedClient` (public read, no auth)
- no client-side Supabase service-role keys or R2 credentials

Web/Mobile now have tested product boundaries for: media upload, pet media upload+attach, pet publish, pet draft, pet draft save flow, pet feed.

## 5. Recommended Next Work Item

The public read path is partially complete (`GET /pets` exists). Likely candidates:

- `PET-PROFILE-WORKER-001` — public `GET /pets/:petId` single-pet route
- `PET-PROFILE-CLIENT-001` — client wrapper for the single-pet route
- `WEB-PET-PROFILE-001` / `MOBILE-PET-PROFILE-001` — product boundaries for the pet profile view

Start each on its own `agent/<WORK-ITEM-ID>` branch per the convention in Section 3.

## 6. Handoff Prompt For Codex

Use this prompt in a new Codex thread:

```text
Read AGENTS.md, docs/codex-resume.md, docs/work-tracks/remake-foundation.md and the latest docs/checkpoints file. Continue Pic4Paws V2 from main using strict SDD/TDD. Do not work on main. Start the next recommended work item unless I specify another one.
```
