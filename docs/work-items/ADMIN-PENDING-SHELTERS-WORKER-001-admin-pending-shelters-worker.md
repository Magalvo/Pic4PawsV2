---
id: ADMIN-PENDING-SHELTERS-WORKER-001
title: Admin Pending Shelters Worker Route
status: done
---

# ADMIN-PENDING-SHELTERS-WORKER-001 - Admin Pending Shelters Worker Route

## Goal

Add an admin-only Worker route that lists shelters waiting for verification review.
Admins currently can approve or reject a shelter when they already know its ID, but there
is no review queue for discovering shelters in `pending_review`.

This first work item establishes the server-side contract only. Client wrappers and Web /
Mobile admin screens should be separate follow-up work items.

## States

No new domain state. The route reads existing shelters with
`verificationStatus: 'pending_review'`.

Route response states:

| State | HTTP | Body |
|---|---:|---|
| Loaded | 200 | `{ status: 'ok', shelters, total }` |
| Unauthenticated | 401 | `{ status: 'unauthenticated' }` |
| Forbidden | 403 | `{ status: 'forbidden' }` |
| Method not allowed | 405 | `{ status: 'method_not_allowed', allowedMethods: ['GET'] }` |
| Missing auth adapter | 501 | `{ status: 'auth_adapter_not_configured' }` |
| Missing repository | 501 | `{ status: 'admin_pending_shelters_repository_not_configured' }` |

## Contract

### Route

`GET /shelters/pending-verification`

- Authenticated route.
- Authorization: `canVerifyShelter(actor)`; only active `admin` actors may read it.
- Query params:
  - `limit`: integer, default `20`, min `1`, max `50`
  - `offset`: integer, default `0`, min `0`
- Registered before `matchWorkerShelterProfileId` so the reserved
  `pending-verification` segment is not treated as a shelter ID.

### Response item

```ts
type AdminPendingShelterSummary = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: 'pending_review';
  city: string;
  district: string | null;
  countryCode: string;
  publicEmail: string | null;
  publicPhone: string | null;
  logoMediaId: string | null;
  createdAt: string;
  updatedAt: string;
};
```

The response deliberately excludes private review data such as `taxId`,
`registrationNumber`, precise address fields, payment account state, and soft-delete
metadata. Those fields may require a later admin detail route with a separate privacy
contract.

### Repository

```ts
type AdminPendingSheltersQuery = {
  limit: number;
  offset: number;
};

type AdminPendingSheltersResult = {
  shelters: AdminPendingShelterSummary[];
  total: number;
};

type AdminPendingSheltersRepository = {
  listPendingShelters(query: AdminPendingSheltersQuery): Promise<AdminPendingSheltersResult>;
};
```

Supabase implementation:

- SELECT from `shelters`
- filter `verification_status = 'pending_review'`
- filter `deleted_at IS NULL`
- order by `updated_at` ascending so older pending reviews surface first
- use `count: 'exact'` and `.range(offset, offset + limit - 1)`

## Affected files

| File | Change |
|---|---|
| `docs/work-items/ADMIN-PENDING-SHELTERS-WORKER-001-admin-pending-shelters-worker.md` | This work item |
| `docs/agent-resume.md` | Mark admin pending-shelters listing as the selected next track |
| `apps/workers/src/admin-pending-shelters.ts` | New handler, matcher, types |
| `apps/workers/src/admin-pending-shelters-supabase.ts` | New Supabase repository |
| `apps/workers/src/dependencies.ts` | Inject and wire repository |
| `apps/workers/src/routes/shelters.ts` | Register route before profile matcher |
| `apps/workers/src/index.ts` | Export handler/repository types |
| `tests/workers/admin-pending-shelters.test.ts` | Worker route tests |
| `tests/workers/admin-pending-shelters-supabase.test.ts` | Supabase query/mapping tests |
| `tests/workers/route-table.test.ts` | Route-ordering assertion |

## Acceptance criteria

- [x] Non-GET requests return 405 before auth/repository access.
- [x] Missing bearer token returns 401.
- [x] Missing authenticator returns 501.
- [x] Authenticator returning `null` returns 401.
- [x] Non-admin authenticated actors receive 403.
- [x] Admin actors receive 200 with `{ status: 'ok', shelters, total }`.
- [x] Repository receives parsed `limit`/`offset`, with invalid values clamped to defaults.
- [x] Missing repository returns 501 after successful admin authorization.
- [x] Supabase query filters `verification_status = 'pending_review'` and `deleted_at IS NULL`.
- [x] Supabase response maps snake_case rows to `AdminPendingShelterSummary`.
- [x] Route matcher claims `/shelters/pending-verification` before public shelter profile matching.
- [x] Response bodies do not leak credential markers.

## Completion Notes

- Implemented admin-only `GET /shelters/pending-verification` Worker route with
  `canVerifyShelter(actor)` authorization.
- Added `AdminPendingSheltersRepository` and Supabase implementation with exact count,
  pagination, `pending_review` + non-deleted filters, and oldest-updated-first ordering.
- Registered the reserved route before `matchWorkerShelterProfileId`; dispatcher test
  confirms the public profile repository is not called for this path.
- Validation: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`,
  `npm.cmd run build`, and `graphify update .` all completed successfully.
