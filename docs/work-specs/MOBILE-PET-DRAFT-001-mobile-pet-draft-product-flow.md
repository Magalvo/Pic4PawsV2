# Work-Spec: Implementation Plan for MOBILE-PET-DRAFT-001

## 1. Target Files

- `docs/work-items/MOBILE-PET-DRAFT-001-mobile-pet-draft-product-flow.md`
- `docs/work-specs/MOBILE-PET-DRAFT-001-mobile-pet-draft-product-flow.md`
- `apps/mobile/src/pet-draft.ts`
- `apps/mobile/src/foundation.ts`
- `tests/mobile/pet-draft-ui.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Add `createMobilePetDraftUi` with an injected dependency:

```ts
draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft'>
```

The Mobile boundary will:

- expose ready/saving/saved/failed PT-PT copy
- call create or update with the safe draft input
- avoid accepting frontend-only status/publish/credential claims
- map success to safe `petId` view model data
- map known failure statuses to safe PT-PT copy
- sanitize failure reasons before exposing UI state

## 3. Testing Strategy

- Add Mobile product tests with a fake injected draft client.
- Assert ready state copy and state list.
- Assert create calls the injected client with only safe draft payload and returns safe save view model.
- Assert update calls the injected client with only safe draft payload and returns safe save view model.
- Assert unauthenticated, unauthorized, invalid draft and worker failures map to safe failure view models.
- Assert failure reasons do not leak bearer tokens, Supabase service-role markers or R2 credentials.
- Assert Mobile foundation content exposes the draft product flow.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No production sessions.
- No client-side persistence authority.
- No provider credentials in UI-facing models.
- Keep the boundary structural and injectable for Mobile tests.

## 6. Implementation Notes

- Added `apps/mobile/src/pet-draft.ts`.
- Added `createMobilePetDraftUi` with injected `draftClient.createPetDraft` and `draftClient.updatePetDraft`.
- The boundary sanitizes draft input before forwarding it to the injected client.
- Create and update successes return safe `petId`, `petName` and operation metadata.
- Known draft failure statuses map to distinct safe PT-PT copy.
- Failure reasons are filtered before reaching UI-facing state.
- Mobile foundation content now exposes `petDraft`.
- Tests cover ready state, create, update, unauthenticated failure, invalid draft failure, authorization/worker failure copy and foundation exposure.
