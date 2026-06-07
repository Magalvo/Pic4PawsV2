# Work-Item: WEB-PET-PROFILE-001 — Web Pet Profile Product Flow

## 1. Context & Problem

`PetProfileClient` now exists in `@pic4paws/client` (PET-PROFILE-CLIENT-001). The Web app has
no product boundary for displaying a single pet profile. Without a tested, copywritten boundary,
no Web component can render the pet detail page.

## 2. Acceptance Criteria

- [ ] Add `apps/web/src/pet-profile.ts` with the Web pet profile product boundary.
- [ ] Export `webPetProfileUiContent` (locale `pt-PT`, status `product-flow-ready`, 5 states).
- [ ] Export `createWebPetProfileUi({ profileClient })` returning `{ getInitialState, loadProfile }`.
- [ ] `getInitialState()` returns `WebPetProfileIdleState` with PT-PT title, message and primaryAction.
- [ ] `loadProfile(petId)` returns `WebPetProfileLoadedState` on success.
- [ ] `loadProfile(petId)` returns `WebPetProfileNotFoundState` when client returns `pet_not_found`.
- [ ] `loadProfile(petId)` returns `WebPetProfileFailedState` with `canRetry: true` on all other failures.
- [ ] `WebPetProfileFailedState` sanitizes credential markers out of `reasons` (defense-in-depth).
- [ ] Add `petProfile` entry to `WebFoundationContent` and `webFoundationContent` in `foundation.ts`.
- [ ] Tests use injected fake `PetProfileClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React components or routing.
- Do not implement pagination or feed views (covered by WEB-PET-FEED-001).
- Do not add authentication or shelter-owner views.

## 4. Completion Notes

_To be filled in after implementation._
