# Work-Item: WEB-SHELTER-MEMBER-001 — Web Shelter Member Product Boundary

## 1. Context & Problem

`SHELTER-MEMBER-CLIENT-001` added the shared client for managing shelter members.

The Web product layer needs a combined read+write state-machine boundary that lets shelter
staff list current members, invite new members by email, assign roles, and remove members —
all within a single boundary. This is the first combined read+write boundary in the project.

## 2. Acceptance Criteria

- [x] Web shelter member product boundary added.
- [x] 8 states: `idle | loading | loaded | forbidden | failed | member_added | member_removed | action_failed`.
- [x] Boundary consumes injected `ShelterMemberClient` dependency (no direct Worker calls).
- [x] `loaded` state surfaces member list with roles.
- [x] `member_added` state reached after a successful `addShelterMember` call.
- [x] `member_removed` state reached after a successful `removeShelterMember` call.
- [x] `action_failed` state reached when an add or remove operation fails without clobbering the loaded member list.
- [x] `forbidden` maps from `forbidden` client failure on initial load.
- [x] Email input and role selector forwarded to `addShelterMember`; no client-side role validation.
- [x] All UI copy in PT-PT in `webShelterMemberUiContent` with `locale === 'pt-PT'`.
- [x] Boundary exposed via `apps/web/src/foundation.ts` → `webFoundationContent.shelterMember`.
- [x] UI-facing results never expose bearer tokens, user IDs, or server internals.
- [x] 10 tests — failing before implementation, passing after.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not wire real browser forms or auth session.
- Do not implement Mobile boundary (separate work item).
- Do not implement role-based UI gating (all authenticated shelter staff see this boundary).

## 4. Completion Notes

Implemented on branch `agent/WEB-SHELTER-MEMBER-001`. Merged as PR #87.
