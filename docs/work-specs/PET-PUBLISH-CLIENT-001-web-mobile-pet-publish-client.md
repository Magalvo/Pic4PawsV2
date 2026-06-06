# Work-Spec: Implementation Plan for PET-PUBLISH-CLIENT-001

## 1. Target Files

- `docs/work-items/PET-PUBLISH-CLIENT-001-web-mobile-pet-publish-client.md`
- `docs/work-specs/PET-PUBLISH-CLIENT-001-web-mobile-pet-publish-client.md`
- `packages/client/src/index.ts`
- `tests/client/pet-publish-client.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Add a shared client factory:

```ts
createPetPublishClient({
  workerBaseUrl,
  petDraftsPath,
  getAccessToken,
  fetch,
})
```

The client will expose:

```ts
publishPetDraft({ petId })
```

The implementation will:

- build `POST /pets/drafts/:petId/publish` from the configured Worker base URL and pet drafts path
- read the bearer token from the injected provider
- reject missing tokens before calling `fetch`
- send an empty JSON body only, avoiding client-side publish claims
- parse Worker success as `pet_published`
- normalize known Worker statuses into safe client failure statuses
- sanitize failure reasons before exposing them to Web or Mobile

## 3. Testing Strategy

- Assert success calls the expected Worker URL with `POST`, bearer auth and an empty body.
- Assert extra caller fields such as media IDs, publish status or credential markers are not sent.
- Assert missing bearer tokens return `unauthenticated` without calling `fetch`.
- Assert `actor_not_authorized`, `pet_draft_not_found`, `pet_publish_rejected`, `auth_adapter_not_configured` and `pet_publish_repository_not_configured` responses are normalized safely.
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
- No client-side publish authority.
- No Supabase service-role or R2 credentials in client-facing models.
- Keep the client structural and injectable for Web/Mobile tests.

## 6. Implementation Notes

- Added `createPetPublishClient` to `packages/client/src/index.ts`.
- Added typed publish request, success, failure status and result models.
- The client constructs `POST /pets/drafts/:petId/publish` through the configured Worker base URL and pet drafts path.
- Missing bearer tokens return `unauthenticated` without calling `fetch`.
- Publish requests send an empty JSON body only, so caller-supplied media IDs, status claims or credential markers are not forwarded.
- Worker success is parsed from `pet_published` with `petId` and `publishedAt`.
- Known Worker failures are normalized to safe client statuses and reasons are sanitized before being exposed.
- Tests cover success, missing token, rejected publish, known Worker statuses and malformed responses.
