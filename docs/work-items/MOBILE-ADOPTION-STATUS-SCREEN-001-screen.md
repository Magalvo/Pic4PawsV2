---
id: MOBILE-ADOPTION-STATUS-SCREEN-001
title: Mobile shelter adoption status update screen
status: done
---

# Work-Item: MOBILE-ADOPTION-STATUS-SCREEN-001 — Mobile Adoption Status Screen

## Goal

Create the shelter manager's adoption status update screen at `/abrigos/[shelterId]/candidaturas/[applicationId]`
wired to `createMobileAdoptionStatusUi`. Allows setting one of four `AdoptionStatusShelterManageStatus` values.

## States

- `idle` — four tappable buttons: under_review / more_info_requested / approved / rejected
- `submitting` — loading text while the request is in flight
- `succeeded` — success confirmation with applicationId and newStatus
- `failed` — error message; "Tentar de novo" resets to idle

## Affected Files

- `docs/work-items/MOBILE-ADOPTION-STATUS-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/abrigos/[shelterId]/candidaturas/[applicationId].tsx` — adoption status screen
- `tests/mobile/adoption-status-screen.test.ts` — boundary contract tests

## Contract

- `applicationId` from `useLocalSearchParams`; `shelterId` unused (applicationId is globally unique)
- `ui.getInitialState()` drives initial state; `manageAdoptionStatus(applicationId, status)` called on tap
- Subdirectory routing: `candidaturas/` folder required to coexist with any future `candidaturas.tsx` sibling

## Completion Notes

5 boundary contract tests pass (succeeded, succeeded-fields, forbidden→failed, canRetry, getInitialState). Typecheck clean.
