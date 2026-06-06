# Work-Spec: Implementation Plan for PET-MEDIA-ATTACH-CLIENT-001

## 1. Target Files

- `docs/work-items/PET-MEDIA-ATTACH-CLIENT-001-web-mobile-pet-media-attach-client.md`
- `docs/work-specs/PET-MEDIA-ATTACH-CLIENT-001-web-mobile-pet-media-attach-client.md`
- `packages/client/src/index.ts`
- `tests/client/pet-media-attach-client.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Add `createPetMediaAttachClient` to `@pic4paws/client`.

Input:

- `workerBaseUrl`
- `petDraftsPath`
- `getAccessToken`
- `fetch`

Client method:

```ts
attachPetMedia({ petId, mediaId })
```

It will:

- reject missing access tokens locally
- build the route from `petDraftsPath`, `petId` and `/media`
- POST sanitized payload `{ mediaId }`
- parse JSON responses defensively
- normalize success to `{ ok: true, status: 'pet_media_attached', petId, mediaId, mediaIds, heroMediaId }`
- normalize Worker failures to typed client statuses and safe reason arrays

## 3. Testing Strategy

- Assert the successful request URL, method, headers and sanitized JSON body.
- Assert only the Worker route receives the bearer token.
- Assert missing token returns local unauthenticated result without network calls.
- Assert invalid/rejected/not-found/unauthorized Worker responses map to safe failure statuses.
- Assert malformed success and non-JSON responses map to generic `worker_request_failed`.
- Assert result JSON never contains signed URLs or provider credential markers.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No signed URLs in client result models.
- No provider credential fields in request payloads or returned bodies.
- No dependency on browser-only or mobile-only APIs.

## 6. Implementation Notes

Implemented on `codex/PET-MEDIA-ATTACH-CLIENT-001`.

- `packages/client/src/index.ts` now exports `createPetMediaAttachClient`.
- The client accepts `workerBaseUrl`, `petDraftsPath`, `getAccessToken` and injected `fetch`.
- The `attachPetMedia` method builds `/pets/drafts/:petId/media`, sends bearer auth to the Worker only, and sends a minimal `{ mediaId }` body.
- The client parses Worker JSON defensively and returns safe typed results.
- `tests/client/pet-media-attach-client.test.ts` covers successful attach, missing token, rejected attach, explicit Worker statuses, malformed success and non-JSON failures.
