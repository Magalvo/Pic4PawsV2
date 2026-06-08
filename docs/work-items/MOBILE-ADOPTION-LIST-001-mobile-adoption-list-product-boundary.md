# Work-Item: MOBILE-ADOPTION-LIST-001 — Mobile Adoption List Product Boundary

## 1. Context & Problem

`ADOPTION-LIST-CLIENT-001` provides `createAdoptionListClient` and `WEB-ADOPTION-LIST-001`
is merged. The Mobile product boundary has no adoption list flow — shelter members cannot
see incoming applications from the mobile app.

## 2. Acceptance Criteria

- [ ] Add `apps/mobile/src/adoption-list.ts` with:
  - `MobileAdoptionListUiContent` type and `mobileAdoptionListUiContent` constant
    (locale `pt-PT`, status `product-flow-ready`, 6 states:
    `idle`, `loading`, `loaded`, `empty`, `forbidden`, `failed`).
  - All 6 state view-model types: `MobileAdoptionListIdleState`, `MobileAdoptionListLoadingState`,
    `MobileAdoptionListLoadedState`, `MobileAdoptionListEmptyState`,
    `MobileAdoptionListForbiddenState`, `MobileAdoptionListFailedState`.
  - `MobileAdoptionListResultViewModel` union.
  - `createMobileAdoptionListUi({ adoptionListClient })` returning
    `{ getInitialState, loadApplications }`.
  - `getInitialState()` returns `MobileAdoptionListIdleState` with PT-PT copy.
  - `loadApplications(shelterId, query?)`:
    - ok + items → `MobileAdoptionListLoadedState` with `applications` and `total`.
    - ok + empty → `MobileAdoptionListEmptyState` (dedicated).
    - `forbidden` → `MobileAdoptionListForbiddenState` (dedicated, not `failed`).
    - other failure → `MobileAdoptionListFailedState` with `canRetry: true` + sanitized reasons.
  - Credential markers sanitized in `MobileAdoptionListFailedState.reasons`.
- [ ] Add `adoptionList` entry to `MobileFoundationContent` and `mobileFoundationContent`
  in `apps/mobile/src/foundation.ts`.
- [ ] Tests use injected fake `AdoptionListClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React Native components or navigation.
- Do not implement Web boundary (already done in WEB-ADOPTION-LIST-001).

## 4. Completion Notes

_To be filled in after implementation._
