# Work-Spec: Implementation Plan for WEB-PET-DRAFT-001

## 1. Target Files

- `docs/work-items/WEB-PET-DRAFT-001-web-pet-draft-product-flow.md`
- `docs/work-specs/WEB-PET-DRAFT-001-web-pet-draft-product-flow.md`
- `apps/web/src/pet-draft.ts`
- `apps/web/src/foundation.ts`
- `tests/web/pet-draft-ui.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Add `createWebPetDraftUi` with an injected dependency:

```ts
draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft'>
```

The Web boundary will:

- expose ready/saving/saved/failed PT-PT copy
- call create or update with the safe draft input
- avoid accepting frontend-only status/publish/credential claims
- map success to safe `petId` view model data
- map known failure statuses to safe PT-PT copy
- sanitize failure reasons before exposing UI state

## 3. Testing Strategy

- Add Web product tests with a fake injected draft client.
- Assert ready state copy and state list.
- Assert create calls the injected client with only safe draft payload and returns safe save view model.
- Assert update calls the injected client with only safe draft payload and returns safe save view model.
- Assert unauthenticated, unauthorized, invalid draft and worker failures map to safe failure view models.
- Assert failure reasons do not leak bearer tokens, Supabase service-role markers or R2 credentials.
- Assert Web foundation content exposes the draft product flow.

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
- Keep the boundary structural and injectable for Web tests.

## 6. Implementation Notes

- Added `apps/web/src/pet-draft.ts`.
- Added `createWebPetDraftUi` with injected `draftClient.createPetDraft` and `draftClient.updatePetDraft`.
- The boundary sanitizes draft input before forwarding it to the injected client.
- Create and update successes return safe `petId`, `petName` and operation metadata.
- Known draft failure statuses map to distinct safe PT-PT copy.
- Failure reasons are filtered before reaching UI-facing state.
- Web foundation content now exposes `petDraft`.
- Tests cover ready state, create, update, unauthenticated failure, invalid draft failure, authorization/worker failure copy and foundation exposure.
