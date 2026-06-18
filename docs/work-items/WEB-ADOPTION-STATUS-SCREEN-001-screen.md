---
id: WEB-ADOPTION-STATUS-SCREEN-001
title: Web shelter adoption status update page
status: done
---

# Work-Item: WEB-ADOPTION-STATUS-SCREEN-001 — Web Adoption Status Page

## Goal

Create the shelter manager's adoption status update page at `/abrigos/[shelterId]/candidaturas/[applicationId]`
(Next.js App Router) wired to `createWebAdoptionStatusUi`. Allows setting one of four status values.

## States

- `idle` (IDLE constant) — four buttons: under_review / more_info_requested / approved / rejected
- `submitting` — loading text while request is in flight
- `succeeded` — success message with applicationId and newStatus
- `failed` — error message; "Tentar de novo" resets to IDLE

## Affected Files

- `docs/work-items/WEB-ADOPTION-STATUS-SCREEN-001-screen.md` (this file)
- `apps/web/app/abrigos/[shelterId]/candidaturas/[applicationId]/page.tsx` — adoption status page
- `tests/web/adoption-status-page.test.ts` — boundary contract tests

## Contract

- `applicationId` from `use(params)`; `shelterId` unused (applicationId is globally unique)
- Module-level `IDLE: WebAdoptionStatusIdleState` constant; `ui.manageAdoptionStatus(applicationId, status)` on click
- Nested route: `candidaturas/[applicationId]/` under `[shelterId]/` for shelter-scoped adoption management

## Completion Notes

3 boundary contract tests pass (succeeded, failed/forbidden, failed/network). Typecheck clean.
