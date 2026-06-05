# Work-Spec: Implementation Plan for PET-MEDIA-001

## 1. Target Files

- `docs/work-items/PET-MEDIA-001-persisted-media-for-pet-publishing.md`
- `docs/work-specs/PET-MEDIA-001-persisted-media-for-pet-publishing.md`
- `packages/domain/src/pet-lifecycle.ts`
- `tests/domain/pet-media-lifecycle.test.ts`
- `tests/domain/pet-lifecycle.test.ts`

## 2. Proposed Technical Approach

Extend the pet lifecycle domain model with a small persisted media asset view. Add pure helpers for checking whether a media asset is a public pet image, attaching it to a draft and validating publishing requirements against resolved media assets.

Expose:

- `PetMediaAssetRecord`
- `attachMediaAssetToPetDraft`
- `validatePetDraftForPublishing(pet, mediaAssets?)`

## 3. Testing Strategy

- Initial failing test: assert valid public media attaches, invalid media is rejected, first valid image becomes hero media and publishing validation uses persisted public media.
- Expected input data: pet draft and persisted media asset fixtures.
- Expected output/behavior: deterministic updated draft or block reasons; no DB writes.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Domain-only pure functions.
- No Supabase access.
- No R2 access.
- No UI or upload side effects.
