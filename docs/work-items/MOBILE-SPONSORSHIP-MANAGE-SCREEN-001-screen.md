---
id: MOBILE-SPONSORSHIP-MANAGE-SCREEN-001
title: Mobile sponsorship manage screen
status: done
---

# Work-Item: MOBILE-SPONSORSHIP-MANAGE-SCREEN-001 — Mobile Sponsorship Manage Screen

## Goal

Create the sponsorship management screen at `/patrocinios/[sponsorshipId]` wired to
`createMobileSponsorshipManageUi`. Allows adopters to pause or cancel a recurring sponsorship.

## States

- `idle` — pause and cancel action buttons shown
- `submitting` (local) — request in-flight
- `succeeded` — shows new status label; back button
- `failed` — error message; back button

## Affected Files

- `docs/work-items/MOBILE-SPONSORSHIP-MANAGE-SCREEN-001-screen.md` (this file)
- `apps/mobile/app/patrocinios/[sponsorshipId].tsx` — sponsorship manage screen
- `tests/mobile/sponsorship-manage-screen.test.ts` — boundary contract tests

## Contract

- `sponsorshipId` from `useLocalSearchParams`; passed as first arg to `ui.manageSponsorship`
- Idle state constant avoids re-creating client on render
- Pause action calls `manageSponsorship(id, 'paused')`; cancel calls `manageSponsorship(id, 'cancelled')`

## Completion Notes

5 boundary contract tests pass (succeeded, succeeded-fields, failed-forbidden, failed-canRetry, getInitialState).
Idle state seeded from `IDLE` constant instead of calling `getInitialState()` via factory to avoid
constructing a Supabase client at module scope.
