---
id: ADMIN-PENDING-SHELTERS-WEB-PAGE-001
title: Web Admin Pending Shelters Page
status: done
---

# ADMIN-PENDING-SHELTERS-WEB-PAGE-001 — Web Admin Pending Shelters Page

## Goal

Wire `createWebAdminPendingSheltersUi` into a Next.js App Router page at
`/admin/abrigos-pendentes` so admins can view and navigate to each pending shelter's
verification page. Depends on `ADMIN-PENDING-SHELTERS-WEB-001` (boundary already merged).

## Route

`apps/web/app/admin/abrigos-pendentes/page.tsx` — client component, auto-loads on mount.

## States rendered

| State | UI |
|-------|----|
| `null` | "A carregar..." spinner paragraph |
| `idle` | title + "Carregar abrigos" button (transient, replaced immediately by load |
| `loaded` | list of shelters, each linking to `reviewHref` |
| `empty` | "Sem abrigos pendentes" message + reload button |
| `forbidden` | "Acesso reservado" + link to home |
| `failed` | error message + "Entrar na conta" (unauthenticated) + retry button |

## Affected files

| File | Change |
|------|--------|
| `apps/web/app/admin/abrigos-pendentes/page.tsx` | New — App Router client page |
| `docs/work-items/ADMIN-PENDING-SHELTERS-WEB-PAGE-001-admin-pending-shelters-web-page.md` | This file |

## Acceptance criteria

- [x] Page auto-loads pending shelters on mount.
- [x] Loaded state renders shelter name, city, and a link to `/abrigos/:id/verificar`.
- [x] Empty state shows PT-PT message with reload.
- [x] Forbidden state shows PT-PT message and link to home.
- [x] Failed `unauthenticated` shows "Entrar na conta" link.
- [x] All other failed states show retry button.
- [x] `npm run typecheck` passes with no errors.
