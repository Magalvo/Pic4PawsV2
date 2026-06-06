# Work-Spec: Implementation Plan for MOBILE-PET-PUBLISH-001

## 1. Target Files

- `docs/work-items/MOBILE-PET-PUBLISH-001-mobile-pet-publish-product-flow.md`
- `docs/work-specs/MOBILE-PET-PUBLISH-001-mobile-pet-publish-product-flow.md`
- `apps/mobile/src/pet-publish.ts`
- `apps/mobile/src/foundation.ts`
- `tests/mobile/pet-publish-ui.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Add `createMobilePetPublishUi` with an injected dependency:

```ts
publishClient: Pick<PetPublishClient, 'publishPetDraft'>
```

The Mobile boundary will:

- expose ready/publishing/published/failed PT-PT copy
- call `publishClient.publishPetDraft({ petId })`
- never send media IDs, pet status, shelter verification or actor claims
- map success to safe `petId` and `publishedAt` view model data
- map known failure statuses to safe PT-PT copy
- sanitize failure reasons before exposing UI state

## 3. Testing Strategy

- Add Mobile product tests with a fake injected publish client.
- Assert ready state copy and state list.
- Assert success calls publish with pet ID only and returns safe publish metadata.
- Assert unauthenticated, unauthorized, missing draft, rejected publish and worker failures map to safe failure view models.
- Assert failure reasons do not leak bearer tokens, Supabase service-role markers or R2 credentials.
- Assert Mobile foundation content exposes the publish product flow.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No production sessions.
- No client-side publish authority.
- No provider credentials in UI-facing models.
- Keep the boundary structural and injectable for Mobile tests.

## 6. Implementation Notes

- Added `apps/mobile/src/pet-publish.ts`.
- Added `createMobilePetPublishUi` with injected `publishClient.publishPetDraft`.
- The boundary calls publish with `{ petId }` only.
- Success returns safe `petId`, `petName` and `publishedAt` view model data.
- Known publish failure statuses map to distinct safe PT-PT copy.
- Failure reasons are filtered before reaching UI-facing state.
- Mobile foundation content now exposes `petPublish`.
- Tests cover ready state, success, unauthenticated failure, rejected publish failure, authorization/missing draft/worker failure copy and foundation exposure.
