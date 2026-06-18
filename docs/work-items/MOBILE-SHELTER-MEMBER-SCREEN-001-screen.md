---
id: MOBILE-SHELTER-MEMBER-SCREEN-001
title: Mobile shelter member management screen
status: done
---

# Work-Item: MOBILE-SHELTER-MEMBER-SCREEN-001 — Mobile Shelter Member Screen

## Goal

Create the shelter manager's member management screen at `/abrigos/[shelterId]/membros` wired to
`createMobileShelterMemberUi`. Displays the member list and allows adding/removing members.

## States

- `null` (loading) — spinner while fetching
- `forbidden` — user is not a shelter owner; title + message
- `failed` — network error; retry button
- `loaded` — member cards with remove button (owners cannot be removed); add-member form above the list

## Affected Files

- `docs/work-items/MOBILE-SHELTER-MEMBER-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/membros.tsx` — shelter member screen
- `tests/mobile/shelter-member-screen.test.ts` — boundary contract tests

## Contract

- `shelterId` from `useLocalSearchParams`; passed to `ui.loadShelterMembers(shelterId)`
- Add form calls `ui.addShelterMember(shelterId, { userId, role: 'shelter_member' })`; on success reloads; on failure shows Alert
- Remove button calls `ui.removeShelterMember(shelterId, memberId)`; on success reloads; on failure shows Alert
- `shelter_owner` cards do not show a remove button

## Completion Notes

6 boundary contract tests pass (loaded, loaded-fields, forbidden, failed, member_added, member_removed). Typecheck clean.
