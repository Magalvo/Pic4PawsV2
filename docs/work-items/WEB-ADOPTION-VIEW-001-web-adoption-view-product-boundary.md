# Work-Item: WEB-ADOPTION-VIEW-001 — Web Adoption View Product Boundary

## 1. Context & Problem

`ADOPTION-VIEW-CLIENT-001` added the shared client for reading an adoption application.

The Web product layer needs a state-machine boundary that drives the UI from `idle` through
loading to a fully rendered view, and maps client failures to safe, PT-PT user-facing states.

## 2. Acceptance Criteria

- [x] Web adoption view product boundary added.
- [x] 6 states: `idle | loading | loaded | not_found | forbidden | failed`.
- [x] Boundary consumes injected `AdoptionViewClient` dependency (no direct Worker calls).
- [x] `loaded` state surfaces application detail: status, shelter response, comments, timeline.
- [x] `not_found` maps from `adoption_not_found` client failure.
- [x] `forbidden` maps from `forbidden` client failure.
- [x] `failed` maps from all other client failures.
- [x] All UI copy in PT-PT in `webAdoptionViewUiContent` with `locale === 'pt-PT'`.
- [x] Boundary exposed via `apps/web/src/foundation.ts` → `webFoundationContent.adoptionView`.
- [x] UI-facing results never expose bearer tokens, user IDs, or server internals.
- [x] 8 tests — failing before implementation, passing after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real browser routing or auth session.
- Do not implement Mobile boundary (separate work item).
- Do not allow mutation from this boundary.

## 4. Completion Notes

Implemented on branch `agent/WEB-ADOPTION-VIEW-001`. Merged as PR #82.
