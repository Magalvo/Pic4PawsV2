# Work-Item: MOBILE-SHELTER-MEMBER-001 — Mobile Shelter Member Product Boundary

## 1. Context & Problem

`SHELTER-MEMBER-CLIENT-001` added the shared client for managing shelter members.
`WEB-SHELTER-MEMBER-001` added the Web boundary.

The Mobile product layer needs its own combined read+write boundary mirroring the Web
boundary, adapted for mobile UX (simpler list + invite card layout) and PT-PT copy
prefixed with `Mobile`.

## 2. Acceptance Criteria

- [x] Mobile shelter member product boundary added.
- [x] 8 states: `idle | loading | loaded | forbidden | failed | member_added | member_removed | action_failed`.
- [x] Boundary consumes injected `ShelterMemberClient` dependency (no direct Worker calls).
- [x] `loaded` state surfaces member list with roles.
- [x] `member_added`, `member_removed`, and `action_failed` states work identically to the Web boundary.
- [x] All UI copy in PT-PT in `mobileShelterMemberUiContent` with `locale === 'pt-PT'`.
- [x] Boundary exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.shelterMember`.
- [x] UI-facing results never expose bearer tokens, user IDs, or server internals.
- [x] 10 tests — failing before implementation, passing after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real React Native navigation or auth session.
- Do not implement Web boundary (separate work item).

## 4. Completion Notes

Implemented on branch `agent/MOBILE-SHELTER-MEMBER-001`. Merged as PR #88.
