# Work-Item: MOBILE-SHELTER-PROFILE-001 — Mobile Shelter Profile Product Boundary

## 1. Context & Problem

`ShelterProfileClient` exists in `@pic4paws/client` and the Web boundary
(WEB-SHELTER-PROFILE-001) is merged. The Mobile app has no equivalent product boundary.
Without it, no Mobile screen can render the shelter detail view and the feed → pet → shelter
discovery loop remains incomplete on Mobile.

## 2. Acceptance Criteria

- [ ] Add `apps/mobile/src/shelter-profile.ts` with the Mobile shelter profile product boundary.
- [ ] Export `mobileShelterProfileUiContent` (locale `pt-PT`, status `product-flow-ready`, 5 states:
  `idle`, `loading`, `loaded`, `not_found`, `failed`).
- [ ] Export `createMobileShelterProfileUi({ shelterProfileClient })` returning
  `{ getInitialState, loadProfile }`.
- [ ] `getInitialState()` returns `MobileShelterProfileIdleState` with PT-PT title, message and
  `primaryAction`.
- [ ] `loadProfile(shelterId)` returns `MobileShelterProfileLoadedState` on success.
- [ ] `loadProfile(shelterId)` returns `MobileShelterProfileNotFoundState` when client returns
  `shelter_not_found` (dedicated state, not `failed`).
- [ ] `loadProfile(shelterId)` returns `MobileShelterProfileFailedState` with `canRetry: true` on
  all other failures.
- [ ] `MobileShelterProfileFailedState` sanitizes credential markers out of `reasons`
  (defense-in-depth).
- [ ] Add `shelterProfile` entry to `MobileFoundationContent` and `mobileFoundationContent` in
  `foundation.ts`.
- [ ] Tests use injected fake `ShelterProfileClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React Native components or navigation.
- Do not implement shelter listing / feed views.
- Do not add authentication or shelter-owner views.

## 4. Completion Notes

_To be filled in after implementation._
