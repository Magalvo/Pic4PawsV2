---
id: SHELTER-VERIFY-NAV-001
title: Shelter Verification Navigation
status: done
pr: 215
---

# SHELTER-VERIFY-NAV-001 - Shelter Verification Navigation

## Goal

Add a "Verificar abrigo" entry point on the shelter edit page (web and mobile) so shelter
owners can discover and navigate to the verification workflow from their management area.
Without this link, `/abrigos/:shelterId/verificar` is unreachable through normal UX flows.

## States

No new states or boundaries. This work item adds navigation links to two existing pages.

| Location | Change |
|----------|--------|
| Web idle form | "Verificar abrigo" link below the save button -> `/abrigos/:shelterId/verificar` |
| Mobile idle scroll | "Verificar abrigo" secondary button below the save button -> same route |

## Contract

- Link is present in the idle form render state of both pages.
- Link is absent from the updated and failed render states because those states already have their own navigation.
- No new boundary, no new client call, no new worker route.
- No new test file required: this is a pure page-wiring change; boundaries are tested by existing suites. Typecheck and lint gates validate the links at build time.

## Affected files

| File | Change |
|------|--------|
| `apps/web/app/abrigos/[shelterId]/editar/page.tsx` | Add `<a href="/abrigos/:id/verificar">` below the form |
| `apps/mobile/app/abrigos/[shelterId]/editar.tsx` | Add secondary `TouchableOpacity` below save button |
| `docs/work-items/SHELTER-VERIFY-NAV-001-shelter-verify-nav.md` | This file |

## Dependencies

- Depends on `SHELTER-VERIFY-WEB-001` and `SHELTER-VERIFY-MOBILE-001` because the route must exist.

## Acceptance criteria

- [x] Web: "Verificar abrigo" link renders in the idle form state and href is `/abrigos/:shelterId/verificar`.
- [x] Mobile: "Verificar abrigo" button renders in the idle scroll view and navigates to the verification screen.
- [x] Link/button is absent from updated and failed states.
- [x] `npm run typecheck` passes with no errors.

## Completion Notes

- Implemented in PR #215 as page wiring only: web and mobile shelter edit idle states expose the verification entry point.
- Updated and failed states keep their existing navigation and do not show the verification link/button.
- No new test file was added because this item did not introduce a new boundary or client call.
- Validation recorded in PR #215: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`, and `npm.cmd run build`.
