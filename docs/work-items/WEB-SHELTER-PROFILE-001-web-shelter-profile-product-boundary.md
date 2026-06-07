# Work-Item: WEB-SHELTER-PROFILE-001 — Web Shelter Profile Product Boundary

## 1. Context & Problem

`ShelterProfileClient` is available in `@pic4paws/client` (SHELTER-PROFILE-CLIENT-001 merged).
The Web app has no product boundary for the shelter profile screen. Without it, no Web component
can render a shelter detail view, and adopters cannot follow the feed → pet → shelter discovery loop.

## 2. Acceptance Criteria

- [ ] Add `apps/web/src/shelter-profile.ts` with the Web shelter profile product boundary.
- [ ] Export `webShelterProfileUiContent` (locale `pt-PT`, status `product-flow-ready`, 5 states:
  `idle`, `loading`, `loaded`, `not_found`, `failed`).
- [ ] Export `createWebShelterProfileUi({ shelterProfileClient })` returning
  `{ getInitialState, loadProfile }`.
- [ ] `getInitialState()` returns `WebShelterProfileIdleState` with PT-PT title, message and
  `primaryAction`.
- [ ] `loadProfile(shelterId)` returns `WebShelterProfileLoadedState` on success
  (`title` = shelter name, `shelter` = full shelter object).
- [ ] `loadProfile(shelterId)` returns `WebShelterProfileNotFoundState` when client returns
  `shelter_not_found` (dedicated state, not `failed`).
- [ ] `loadProfile(shelterId)` returns `WebShelterProfileFailedState` with `canRetry: true` on
  all other failures.
- [ ] `WebShelterProfileFailedState` sanitizes credential markers out of `reasons`
  (defense-in-depth).
- [ ] Add `shelterProfile` entry to `WebFoundationContent` and `webFoundationContent` in
  `foundation.ts`.
- [ ] Tests use injected fake `ShelterProfileClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React or Next.js components.
- Do not implement shelter listing / feed views.
- Do not add authentication or shelter-owner views.

## 4. Completion Notes

_To be filled in after implementation._
