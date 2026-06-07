# Work-Item: MOBILE-PET-PROFILE-001 — Mobile Pet Profile Product Flow

## 1. Context & Problem

`PetProfileClient` exists in `@pic4paws/client` and the Web boundary (WEB-PET-PROFILE-001) is
merged. The Mobile app has no equivalent product boundary. Without it, no Mobile component can
render the pet detail screen.

## 2. Acceptance Criteria

- [ ] Add `apps/mobile/src/pet-profile.ts` with the Mobile pet profile product boundary.
- [ ] Export `mobilePetProfileUiContent` (locale `pt-PT`, status `product-flow-ready`, 5 states).
- [ ] Export `createMobilePetProfileUi({ profileClient })` returning `{ getInitialState, loadProfile }`.
- [ ] `getInitialState()` returns `MobilePetProfileIdleState` with PT-PT title, message and primaryAction.
- [ ] `loadProfile(petId)` returns `MobilePetProfileLoadedState` on success.
- [ ] `loadProfile(petId)` returns `MobilePetProfileNotFoundState` when client returns `pet_not_found`.
- [ ] `loadProfile(petId)` returns `MobilePetProfileFailedState` with `canRetry: true` on all other failures.
- [ ] `MobilePetProfileFailedState` sanitizes credential markers out of `reasons` (defense-in-depth).
- [ ] Add `petProfile` entry to `MobileFoundationContent` and `mobileFoundationContent` in `foundation.ts`.
- [ ] Tests use injected fake `PetProfileClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React Native components or navigation.
- Do not implement feed or list views (covered by MOBILE-PET-FEED-001).
- Do not add authentication or shelter-owner views.

## 4. Completion Notes

_To be filled in after implementation._
