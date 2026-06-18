---
id: WEB-SHELTER-MEMBER-SCREEN-001
title: Web shelter member management page
status: done
---

# Work-Item: WEB-SHELTER-MEMBER-SCREEN-001 — Web Shelter Member Page

## Goal

Create the shelter manager's member management page at `/abrigos/[shelterId]/membros` (Next.js App Router)
wired to `createWebShelterMemberUi`. Displays the member list with add/remove controls.

## States

- `null` (loading) — inline loading text
- `forbidden` — title + message
- `failed` — title + message + retry button
- `loaded` — add-member form above the list; `<ul>` of members with remove button (owners excluded)

## Affected Files

- `docs/work-items/WEB-SHELTER-MEMBER-SCREEN-001-screen.md` (this file)
- `apps/web/app/abrigos/[shelterId]/membros/page.tsx` — shelter member page
- `tests/web/shelter-member-page.test.ts` — boundary contract tests

## Contract

- `shelterId` from `use(params)`; `ui.loadShelterMembers`, `ui.addShelterMember`, `ui.removeShelterMember`
- Add form submits userId + role `shelter_member`; on success shows confirmation message and reloads
- `shelter_owner` members shown without a remove button

## Completion Notes

3 boundary contract tests pass (loaded, member_added, member_removed). Typecheck clean.
