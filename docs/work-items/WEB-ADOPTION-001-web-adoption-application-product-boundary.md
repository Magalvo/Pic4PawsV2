# Work-Item: WEB-ADOPTION-001 — Web Adoption Application Product Boundary

## 1. Context & Problem

`AdoptionApplicationClient` (ADOPTION-CLIENT-001) is merged. The Web product boundary has
no adoption flow — the UI layer cannot submit applications or render submission outcomes.
Without this boundary, the Web adopter write path is incomplete.

## 2. Acceptance Criteria

- [ ] Add `apps/web/src/adoption.ts` with the Web adoption product boundary.
- [ ] Export `webAdoptionUiContent` (locale `pt-PT`, status `product-flow-ready`, 5 states:
  `idle`, `submitting`, `submitted`, `pet_not_found`, `failed`).
- [ ] Export `createWebAdoptionUi({ adoptionApplicationClient })` returning
  `{ getInitialState, submitApplication }`.
- [ ] `getInitialState()` returns `WebAdoptionIdleState` with PT-PT title, message, and
  `primaryAction`.
- [ ] `submitApplication(input)` returns `WebAdoptionSubmittedState` on success, including
  `applicationId` and `submittedAt`.
- [ ] `submitApplication(input)` returns `WebAdoptionPetNotFoundState` when client returns
  `pet_not_found` (dedicated state, not `failed`).
- [ ] `submitApplication(input)` returns `WebAdoptionFailedState` with `canRetry: true` for
  all other failures (`unauthenticated`, `worker_request_failed`, `invalid_adoption_application`,
  `worker_response_invalid`, etc.).
- [ ] `WebAdoptionFailedState` sanitizes credential markers out of `reasons`
  (defense-in-depth).
- [ ] Add `adoptionApplication` entry to `WebFoundationContent` and `webFoundationContent`
  in `foundation.ts`.
- [ ] Tests use injected fake `AdoptionApplicationClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React/Next.js components or routing.
- Do not implement form validation in this boundary (handled by the Worker).
- Do not implement authentication flow.

## 4. Completion Notes

_To be filled in after implementation._
