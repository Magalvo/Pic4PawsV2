---
id: ADMIN-PENDING-SHELTERS-MOBILE-001
title: Mobile Admin Pending Shelters Boundary
status: done
---

# ADMIN-PENDING-SHELTERS-MOBILE-001 - Mobile Admin Pending Shelters Boundary

## Goal

Add a Mobile product boundary for the admin review queue of shelters in
`pending_review`, using the existing `AdminPendingSheltersClient`. This prepares the
Expo screen without duplicating client failure mapping, PT-PT copy, verification links,
or credential sanitization.

This work item intentionally does not add an Expo Router screen. The screen should be a
separate follow-up work item after this boundary is merged.

## States

| State | Meaning |
|---|---|
| `idle` | Initial state before loading |
| `loaded` | One or more pending shelters were loaded |
| `empty` | The queue has no pending shelters |
| `forbidden` | Authenticated actor is not an admin |
| `failed` | Request, session, repository, or response failure |

## Contract

### Factory

```ts
createMobileAdminPendingSheltersUi({
  adminPendingSheltersClient,
})
```

### Methods

```ts
getInitialState()
loadPendingShelters(query?: { limit?: number | null; offset?: number | null })
```

### Loaded item view model

```ts
type MobileAdminPendingShelterListItem = AdminPendingShelterClientSummary & {
  reviewHref: string; // /abrigos/:shelterId/verificar
};
```

### Failure mapping

- `forbidden` maps to a dedicated `forbidden` state with admin-specific copy.
- All other failures map to `failed`, preserving the client `status`, sanitized `reasons`,
  and `canRetry: true`.
- Credential-bearing reason strings must never appear in returned state.

## Affected files

| File | Change |
|---|---|
| `docs/work-items/ADMIN-PENDING-SHELTERS-MOBILE-001-admin-pending-shelters-mobile.md` | This work item |
| `apps/mobile/src/admin-pending-shelters.ts` | New Mobile boundary |
| `tests/mobile/admin-pending-shelters-ui.test.ts` | Boundary tests |

## Acceptance criteria

- [x] Content exports `locale: 'pt-PT'` and `status: 'product-flow-ready'`.
- [x] Initial state is `idle` with PT-PT copy.
- [x] Successful non-empty client result maps to `loaded`.
- [x] Loaded items include `reviewHref` pointing to `/abrigos/:shelterId/verificar`.
- [x] Successful empty client result maps to `empty`.
- [x] `forbidden` client result maps to dedicated `forbidden` state.
- [x] `unauthenticated`, repository, request, and invalid-response failures map to `failed`.
- [x] Failure reasons are sanitized.
- [x] Query is passed through to the client unchanged.

## Completion Notes

- Added `createMobileAdminPendingSheltersUi` and `mobileAdminPendingSheltersUiContent` in
  `apps/mobile/src/admin-pending-shelters.ts`.
- The boundary maps admin pending-shelters client results into `idle`, `loaded`, `empty`,
  `forbidden`, and `failed` states with PT-PT copy.
- Loaded shelter items include `reviewHref` values pointing to the existing verification
  route (`/abrigos/:shelterId/verificar`).
- Validation: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`,
  `npm.cmd run build`, and `graphify update .` completed successfully.
