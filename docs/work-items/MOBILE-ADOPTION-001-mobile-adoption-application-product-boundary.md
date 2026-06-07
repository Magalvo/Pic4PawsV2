# Work-Item: MOBILE-ADOPTION-001 — Mobile Adoption Application Product Boundary

## 1. Context & Problem

`AdoptionApplicationClient` (ADOPTION-CLIENT-001) and the Web boundary
(WEB-ADOPTION-001) are merged. The Mobile app has no equivalent product boundary.
Without it, no Mobile screen can submit adoption applications and the adoption write
path remains incomplete on Mobile.

## 2. Acceptance Criteria

- [ ] Add `apps/mobile/src/adoption.ts` with the Mobile adoption product boundary.
- [ ] Export `mobileAdoptionUiContent` (locale `pt-PT`, status `product-flow-ready`, 5 states:
  `idle`, `submitting`, `submitted`, `pet_not_found`, `failed`).
- [ ] Export `createMobileAdoptionUi({ adoptionApplicationClient })` returning
  `{ getInitialState, submitApplication }`.
- [ ] `getInitialState()` returns `MobileAdoptionIdleState` with PT-PT title, message, and
  `primaryAction`.
- [ ] `submitApplication(input)` returns `MobileAdoptionSubmittedState` on success, including
  `applicationId` and `submittedAt`.
- [ ] `submitApplication(input)` returns `MobileAdoptionPetNotFoundState` when client returns
  `pet_not_found` (dedicated state, not `failed`).
- [ ] `submitApplication(input)` returns `MobileAdoptionFailedState` with `canRetry: true` for
  all other failures.
- [ ] `MobileAdoptionFailedState` sanitizes credential markers out of `reasons`
  (defense-in-depth).
- [ ] Add `adoptionApplication` entry to `MobileFoundationContent` and
  `mobileFoundationContent` in `foundation.ts`.
- [ ] Tests use injected fake `AdoptionApplicationClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React Native components or navigation.
- Do not implement form validation in this boundary (handled by the Worker).
- Do not implement authentication flow.

## 4. Completion Notes

_To be filled in after implementation._
