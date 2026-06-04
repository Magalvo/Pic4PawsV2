# Work-Spec: Implementation Plan for PETS-001

## 1. Target Files

- `docs/work-items/PETS-001-pet-draft-publish-lifecycle.md`
- `docs/work-specs/PETS-001-pet-draft-publish-lifecycle.md`
- `packages/domain/src/pet-lifecycle.ts`
- `packages/domain/src/index.ts`
- `tests/domain/pet-lifecycle.test.ts`

## 2. Proposed Technical Approach

Add a persistence-free pet lifecycle module in `packages/domain`. It should model the fields needed to decide whether a draft can become public and should reuse the `AUTH-001` authorization contract through `canPublishPet`.

Expose:

- `validatePetDraftForPublishing`
- `publishPetDraft`

The publish function should return an explicit result union instead of throwing, so UI, workers and API routes can surface validation errors consistently.

## 3. Testing Strategy

- Initial failing test: assert that incomplete drafts, unauthorized actors, unverified shelters and non-draft pets cannot publish.
- Expected input data: in-memory actor and pet draft records.
- Expected output/behavior: valid drafts transition to `published` with `publishedAt`; invalid drafts return reason codes.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Deny publishing by default.
- Keep the lifecycle independent of UI, database clients and external services.
- Require public image evidence before public feed exposure.
- Keep medical data represented as public-safe fields only.

