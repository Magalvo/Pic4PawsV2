---
id: ADMIN-PENDING-SHELTERS-MOBILE-PAGE-001
title: Mobile Admin Pending Shelters Screen
status: done
---

# ADMIN-PENDING-SHELTERS-MOBILE-PAGE-001 — Mobile Admin Pending Shelters Screen

## Goal

Wire `createMobileAdminPendingSheltersUi` into an Expo Router screen at
`/admin/abrigos-pendentes` so admins can view and navigate to each pending shelter's
verification screen. Depends on `ADMIN-PENDING-SHELTERS-MOBILE-001` (boundary already merged).

## Route

`apps/mobile/app/admin/abrigos-pendentes.tsx` — standalone screen, auto-loads on mount.
Uses `mobileSupabaseClient` singleton for auth.

## States rendered

| State | UI |
|-------|----|
| `null` | `ActivityIndicator` |
| `idle` | title + "Carregar abrigos" button (transient, replaced immediately by load) |
| `loaded` | `FlatList` of shelters, each a `TouchableOpacity` → `verificar` screen |
| `empty` | "Sem abrigos pendentes" + reload button |
| `forbidden` | "Acesso reservado" + back button |
| `failed` | error message + "Entrar na conta" (unauthenticated) + retry button |

## Affected files

| File | Change |
|------|--------|
| `apps/mobile/app/admin/abrigos-pendentes.tsx` | New — Expo Router screen |
| `docs/work-items/ADMIN-PENDING-SHELTERS-MOBILE-PAGE-001-admin-pending-shelters-mobile-page.md` | This file |

## Acceptance criteria

- [x] Screen auto-loads pending shelters on mount.
- [x] Loaded state renders shelter name, city, and navigates to `/abrigos/:id/verificar`.
- [x] Empty state shows PT-PT message with reload.
- [x] Forbidden state shows PT-PT message and back navigation.
- [x] Failed `unauthenticated` shows "Entrar na conta" button.
- [x] All other failed states show retry button.
- [x] Uses `mobileSupabaseClient` singleton (not inline `createClient`).
- [x] `npm run typecheck` passes with no errors.
