---
id: ADMIN-PENDING-SHELTERS-WEB-001
title: Web Admin Pending Shelters Boundary
status: done
---

# ADMIN-PENDING-SHELTERS-WEB-001 - Web Admin Pending Shelters Boundary

## Goal

Add a Web product boundary for the admin review queue of shelters in
`pending_review`. The boundary should turn `createAdminPendingSheltersClient` results
into PT-PT view states that a future App Router page can render without duplicating
client failure mapping, copy, sanitization, or verification links.

This work item intentionally does not add a route/page. The App Router page should be a
separate work item after this boundary is merged.

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
createWebAdminPendingSheltersUi({
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
type WebAdminPendingShelterListItem = AdminPendingShelterClientSummary & {
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
| `docs/work-items/ADMIN-PENDING-SHELTERS-WEB-001-admin-pending-shelters-web.md` | This work item |
| `apps/web/src/admin-pending-shelters.ts` | New Web boundary |
| `tests/web/admin-pending-shelters-ui.test.ts` | Boundary tests |

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

- Added `createWebAdminPendingSheltersUi` and `webAdminPendingSheltersUiContent` in
  `apps/web/src/admin-pending-shelters.ts`.
- The boundary maps admin pending-shelters client results into `idle`, `loaded`, `empty`,
  `forbidden`, and `failed` states with PT-PT copy.
- Loaded shelter items include `reviewHref` values pointing to the existing verification
  route (`/abrigos/:shelterId/verificar`).
- Validation: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`,
  `npm.cmd run build`, and `graphify update .` completed successfully.
