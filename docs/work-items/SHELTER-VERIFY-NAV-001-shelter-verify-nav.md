# SHELTER-VERIFY-NAV-001 — Shelter Verification Navigation

## Goal

Add a "Verificar abrigo" entry point on the shelter edit page (web and mobile) so shelter
owners can discover and navigate to the verification workflow from their management area.
Without this link, `/abrigos/:shelterId/verificar` is unreachable through normal UX flows.

## States

No new states or boundaries. This work item adds navigation links to two existing pages.

| Location | Change |
|----------|--------|
| Web idle form | "Verificar abrigo" link below the save button → `/abrigos/:shelterId/verificar` |
| Mobile idle scroll | "Verificar abrigo" secondary button below the save button → same route |

## Contract

- Link is present in the idle (form) render state of both pages.
- Link is absent from the updated and failed render states (already have their own navigation).
- No new boundary, no new client call, no new worker route.
- No new test file required: this is a pure page-wiring change; boundaries are tested by
  existing suites. Typecheck + lint gates validate the links at build time.

## Affected files

| File | Change |
|------|--------|
| `apps/web/app/abrigos/[shelterId]/editar/page.tsx` | Add `<a href="/abrigos/:id/verificar">` below the form |
| `apps/mobile/app/abrigos/[shelterId]/editar.tsx` | Add secondary `TouchableOpacity` below save button |
| `docs/work-items/SHELTER-VERIFY-NAV-001-shelter-verify-nav.md` | This file |

## Dependencies

- Depends on `SHELTER-VERIFY-WEB-001` and `SHELTER-VERIFY-MOBILE-001` (route must exist).

## Acceptance criteria

- [ ] Web: "Verificar abrigo" link renders in the idle form state and href is `/abrigos/:shelterId/verificar`
- [ ] Mobile: "Verificar abrigo" button renders in the idle scroll view and navigates to the verification screen
- [ ] Link/button is absent from updated and failed states
- [ ] `npm run typecheck` passes with no errors
