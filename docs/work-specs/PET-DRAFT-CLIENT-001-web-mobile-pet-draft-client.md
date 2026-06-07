# Work-Spec: Implementation Plan for PET-DRAFT-CLIENT-001

## 1. Target Files

- `docs/work-items/PET-DRAFT-CLIENT-001-web-mobile-pet-draft-client.md`
- `docs/work-specs/PET-DRAFT-CLIENT-001-web-mobile-pet-draft-client.md`
- `packages/client/src/index.ts`
- `tests/client/pet-draft-client.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Add a shared client factory:

```ts
createPetDraftClient({
  workerBaseUrl,
  petDraftsPath,
  getAccessToken,
  fetch,
})
```

The client will expose:

```ts
createPetDraft(draft)
updatePetDraft(draft)
```

The implementation will:

- build Worker URLs from the configured Worker base URL and pet drafts path
- read the bearer token from the injected provider
- reject missing tokens before calling `fetch`
- send only the Worker-safe draft fields
- parse `pet_draft_created` and `pet_draft_updated` success responses
- normalize known Worker statuses into safe client failure statuses
- sanitize failure reasons before exposing them to Web or Mobile

## 3. Testing Strategy

- Assert create calls `POST /pets/drafts` with bearer auth and sanitized draft payload.
- Assert update calls `PATCH /pets/drafts/:petId` with bearer auth and sanitized draft payload.
- Assert extra caller fields such as `publishedAt`, credential markers or debug fields are not sent.
- Assert missing bearer tokens return `unauthenticated` without calling `fetch`.
- Assert `actor_not_authorized`, `invalid_pet_draft`, `auth_adapter_not_configured` and `pet_draft_repository_not_configured` responses are normalized safely.
- Assert malformed JSON and invalid success payloads map to `worker_request_failed`.
- Assert client-facing results do not expose bearer tokens, Supabase service-role keys or R2 credentials.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No production sessions.
- No client-side persistence authority.
- No Supabase service-role or R2 credentials in client-facing models.
- Keep the client structural and injectable for Web/Mobile tests.

## 6. Implementation Notes

- Added `createPetDraftClient` to `packages/client/src/index.ts`.
- Added typed draft input, success, failure status and result models.
- The client constructs `POST /pets/drafts` and `PATCH /pets/drafts/:petId` through the configured Worker base URL and pet drafts path.
- Missing bearer tokens return `unauthenticated` without calling `fetch`.
- Draft requests send only `petId`, `shelterId`, editable draft fields, media IDs, hero media ID and medical metadata.
- Worker successes are parsed from `pet_draft_created` and `pet_draft_updated`.
- Known Worker failures are normalized to safe client statuses and reasons are sanitized before being exposed.
- Tests cover create, update, missing token, invalid draft failure, known Worker statuses and malformed responses.
