# Work-Item: MOBILE-ADOPTION-VIEW-001 — Mobile Adoption View Product Boundary

## 1. Context & Problem

`ADOPTION-VIEW-CLIENT-001` added the shared client for reading an adoption application.
`WEB-ADOPTION-VIEW-001` added the Web boundary.

The Mobile product layer needs its own state-machine boundary mirroring the Web boundary,
adapted for mobile UX conventions and PT-PT copy prefixed with `Mobile`.

## 2. Acceptance Criteria

- [x] Mobile adoption view product boundary added.
- [x] 6 states: `idle | loading | loaded | not_found | forbidden | failed`.
- [x] Boundary consumes injected `AdoptionViewClient` dependency (no direct Worker calls).
- [x] `loaded` state surfaces application detail: status, shelter response, comments, timeline.
- [x] `not_found`, `forbidden`, and `failed` mapped from client failure statuses.
- [x] All UI copy in PT-PT in `mobileAdoptionViewUiContent` with `locale === 'pt-PT'`.
- [x] Boundary exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.adoptionView`.
- [x] UI-facing results never expose bearer tokens, user IDs, or server internals.
- [x] 8 tests — failing before implementation, passing after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real React Native navigation or auth session.
- Do not implement Web boundary (separate work item).
- Do not allow mutation from this boundary.

## 4. Completion Notes

Implemented on branch `agent/MOBILE-ADOPTION-VIEW-001`. Merged as PR #83.
