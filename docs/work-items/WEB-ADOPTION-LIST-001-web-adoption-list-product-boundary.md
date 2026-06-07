# Work-Item: WEB-ADOPTION-LIST-001 — Web Adoption List Product Boundary

## 1. Context & Problem

`ADOPTION-LIST-CLIENT-001` (merged) provides `createAdoptionListClient`. The Web product
boundary has no adoption list flow — shelter members cannot see incoming applications
through a Web product boundary.

## 2. Acceptance Criteria

- [ ] Add `apps/web/src/adoption-list.ts` with:
  - `WebAdoptionListUiContent` type and `webAdoptionListUiContent` constant
    (locale `pt-PT`, status `product-flow-ready`, 6 states:
    `idle`, `loading`, `loaded`, `empty`, `forbidden`, `failed`).
  - All 6 state view-model types: `WebAdoptionListIdleState`, `WebAdoptionListLoadingState`,
    `WebAdoptionListLoadedState`, `WebAdoptionListEmptyState`, `WebAdoptionListForbiddenState`,
    `WebAdoptionListFailedState`.
  - `WebAdoptionListResultViewModel` union.
  - `createWebAdoptionListUi({ adoptionListClient })` returning
    `{ getInitialState, loadApplications }`.
  - `getInitialState()` returns `WebAdoptionListIdleState` with PT-PT copy.
  - `loadApplications(shelterId, query?)`:
    - ok + items → `WebAdoptionListLoadedState` with `applications` and `total`.
    - ok + empty → `WebAdoptionListEmptyState` (dedicated, not `loaded`).
    - `forbidden` → `WebAdoptionListForbiddenState` (dedicated, not `failed`).
    - other failure → `WebAdoptionListFailedState` with `canRetry: true` + sanitized reasons.
  - Credential markers sanitized in `WebAdoptionListFailedState.reasons` (defense-in-depth).
- [ ] Add `adoptionList` entry to `WebFoundationContent` and `webFoundationContent`
  in `apps/web/src/foundation.ts`.
- [ ] Tests use injected fake `AdoptionListClient` — no real network calls.
- [ ] Tests fail before implementation and pass after.
- [ ] All copy is PT-PT.
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement React/Next.js components.
- Do not implement Mobile boundary (MOBILE-ADOPTION-LIST-001).

## 4. Completion Notes

_To be filled in after implementation._
