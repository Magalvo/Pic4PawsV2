---
id: ADMIN-NAV-001
title: Admin Navigation Entry Point to Pending Shelters Queue
status: done
---

# ADMIN-NAV-001 - Admin Navigation Entry Point to Pending Shelters Queue

## Goal

Add a discoverable navigation link from the public shelter listing page to
`/admin/abrigos-pendentes` on both web and mobile. Without this, admin users must know
the direct URL to reach the review queue.

This is the same pattern as `SHELTER-VERIFY-NAV-001` (PR #215): a pure page wiring
change with no new boundary, no new test file, and no conditional auth rendering. The
boundary itself handles `forbidden` for non-admins.

## States

No new states or boundaries. This work item adds navigation links to two existing pages.

| Platform | Location | Element |
|---|---|---|
| Web | `apps/web/app/abrigos/page.tsx` — loaded state | `<a href="/admin/abrigos-pendentes">` |
| Mobile | `apps/mobile/app/(app)/(tabs)/abrigos/index.tsx` — loaded state | `TouchableOpacity` → `router.push` |

## Contract

- Link is present in the loaded render state of both pages.
- No new boundary, no new client call, no new worker route.
- No new test file required: this is a pure page-wiring change. The boundary handles `forbidden` for non-admins. Typecheck and lint gates validate the links at build time.

## Dependencies

- Depends on `ADMIN-PENDING-SHELTERS-WEB-PAGE-001` and `ADMIN-PENDING-SHELTERS-MOBILE-PAGE-001` because the route must exist.

## Acceptance criteria

- [x] Web shelter listing loaded state includes a link to `/admin/abrigos-pendentes`.
- [x] Mobile shelter listing loaded state includes a button to `/admin/abrigos-pendentes`.
- [x] No conditional auth checks in the page — boundary handles `forbidden`.
- [x] Copy is in PT-PT.
- [x] All validation gates pass (typecheck, lint, test, build).

## Affected files

| File | Change |
|---|---|
| `docs/work-items/ADMIN-NAV-001-admin-nav-entry-point.md` | This work item |
| `apps/web/app/abrigos/page.tsx` | Add link in loaded state |
| `apps/mobile/app/(app)/(tabs)/abrigos/index.tsx` | Add button in loaded state |

## Completion Notes

- Added `<a href="/admin/abrigos-pendentes">Fila de revisão</a>` at the bottom of the
  loaded state render in `apps/web/app/abrigos/page.tsx`.
- Added `TouchableOpacity` + `router.push('/admin/abrigos-pendentes')` at the bottom of
  the loaded state in `apps/mobile/app/(app)/(tabs)/abrigos/index.tsx`; added
  `useRouter` import from `expo-router` and `TouchableOpacity` to the React Native
  import list.
- Present in loaded state only, matching the precedent from `SHELTER-VERIFY-NAV-001`.
- Validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all
  pass.
