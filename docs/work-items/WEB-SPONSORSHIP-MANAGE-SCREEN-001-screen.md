---
id: WEB-SPONSORSHIP-MANAGE-SCREEN-001
title: Web sponsorship manage page
status: done
---

# Work-Item: WEB-SPONSORSHIP-MANAGE-SCREEN-001 — Web Sponsorship Manage Page

## Goal

Create the sponsorship management page at `/patrocinios/[sponsorshipId]` wired to
`createWebSponsorshipManageUi`. Allows adopters to pause or cancel a recurring sponsorship.

## States

- `idle` — pause and cancel action buttons shown
- `submitting` (local) — loading message with `aria-live="polite"`
- `succeeded` — shows new status label; link back to `/patrocinios`
- `failed` — error message; link back to `/patrocinios`

## Affected Files

- `docs/work-items/WEB-SPONSORSHIP-MANAGE-SCREEN-001-screen.md` (this file)
- `apps/web/app/patrocinios/[sponsorshipId]/page.tsx` — sponsorship manage page
- `tests/web/sponsorship-manage-page.test.ts` — boundary contract tests

## Contract

- `sponsorshipId` from `use(params)` (Next.js App Router pattern)
- Idle state seeded from `IDLE` constant
- Pause calls `manageSponsorship(id, 'paused')`; cancel calls `manageSponsorship(id, 'cancelled')`

## Completion Notes

3 boundary contract tests pass (succeeded, succeeded-fields, failed).
