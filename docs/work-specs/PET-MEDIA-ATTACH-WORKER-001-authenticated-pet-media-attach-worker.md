# Work-Spec: Implementation Plan for PET-MEDIA-ATTACH-WORKER-001

## 1. Target Files

- `docs/work-items/PET-MEDIA-ATTACH-WORKER-001-authenticated-pet-media-attach-worker.md`
- `docs/work-specs/PET-MEDIA-ATTACH-WORKER-001-authenticated-pet-media-attach-worker.md`
- `apps/workers/src/pet-drafts.ts`
- `apps/workers/src/pet-supabase.ts`
- `apps/workers/src/index.ts`
- `tests/workers/pet-media-attach-boundary.test.ts`
- `tests/workers/pet-supabase-repository.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Extend the existing pet draft Worker route matcher with an `attach_media` operation for:

```text
POST /pets/drafts/:petId/media
```

Add `PetMediaAttachRepository` with:

- `loadAttachContext(petId, mediaId)`
- `attachMediaToDraft(petId, pet, actor)`

The handler will:

- require `POST`
- parse payload `{ mediaId }`
- authenticate through `petDraftAuthenticator`
- require `petMediaAttachRepository`
- load persisted pet and media asset
- return `404` when context is missing
- use `canManageShelter` for shelter authorization
- call `attachMediaAssetToPetDraft`
- persist the resulting draft media state
- return `{ status: 'pet_media_attached', petId, mediaId, mediaIds, heroMediaId }`

## 3. Testing Strategy

- Initial failing tests assert `POST /pets/drafts/:petId/media` is routed and handled.
- Assert success attaches a same-shelter public image and sets first image as hero when needed.
- Assert auth/repository missing responses are explicit and safe.
- Assert unauthorized actors, missing context, invalid payloads and invalid media attachments are rejected safely.
- Assert the Supabase adapter loads pet/media context and persists only media fields.
- Assert responses and thrown adapter errors do not leak signed URLs or credentials.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No client-side media array trust.
- No signed URL persistence or exposure.
- No R2 or Supabase credentials in returned bodies or adapter error messages.

## 6. Implementation Notes

Implemented on `codex/PET-MEDIA-ATTACH-WORKER-001`.

- `matchWorkerPetDraftRoute` now recognizes `POST /pets/drafts/:petId/media`.
- `handleWorkerPetDraftRequest` validates `{ mediaId }`, authenticates the actor, loads persisted context and applies `attachMediaAssetToPetDraft`.
- `PetMediaAttachRepository` was added to Worker dependency resolution and public exports.
- `createSupabasePetRepositories` now returns `petMediaAttachRepository`.
- The Supabase adapter loads persisted `pets` and `media_assets` rows, then updates only `media_ids`, `hero_media_id` and `updated_at` on draft pets.
- Tests cover success, missing adapters, invalid payloads, unauthorized actors, missing context, domain rejection reasons and safe response bodies.
