# Work-Item: PET-FEED-CLIENT-001 — Public Pet Feed Client

## 1. Context & Problem

`PET-FEED-WORKER-001` added a public `GET /pets` route on the Worker that returns paginated published pets.
No client package yet wraps this route. Web and Mobile product boundaries cannot call it without
implementing ad-hoc fetch logic and duplicating error-handling and sanitization.

## 2. Acceptance Criteria

- [ ] Add `PetFeedPet`, `PetFeedClientQuery`, `PetFeedClientResult` types to `@pic4paws/client`.
- [ ] `createPetFeedClient({ workerBaseUrl, petFeedPath, fetch })` — no auth header (public route).
- [ ] Query parameters `species`, `limit`, `offset` serialised from `PetFeedClientQuery`.
- [ ] Success response `{ status: 'ok', pets: [...], total: N }` mapped to `PetFeedClientSuccess`.
- [ ] Non-ok HTTP responses, network errors and malformed response bodies mapped to typed failures.
- [ ] Error reasons sanitized through `sanitizeReasons` before being returned.
- [ ] Tests use injected `fetch` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- No authentication — this is a public read-only client.
- No caching, retry logic, or pagination cursor support.
- No shelter-scoped feed filtering.

## 4. Completion Notes

_To be filled in after implementation._
