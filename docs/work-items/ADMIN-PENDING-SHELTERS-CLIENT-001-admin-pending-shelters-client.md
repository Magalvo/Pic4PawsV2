---
id: ADMIN-PENDING-SHELTERS-CLIENT-001
title: Admin Pending Shelters Client Wrapper
status: done
---

# ADMIN-PENDING-SHELTERS-CLIENT-001 - Admin Pending Shelters Client Wrapper

## Goal

Expose the admin pending-shelters review queue route through `@pic4paws/client` so Web
and Mobile admin boundaries can load shelters in `pending_review` without duplicating
fetch, auth, URL, failure mapping, or reason-sanitization logic.

## States

No new product UI states. This is a client boundary over the Worker route introduced in
`ADMIN-PENDING-SHELTERS-WORKER-001`.

Client result states:

| State | Result |
|---|---|
| Loaded | `{ ok: true, status: 'ok', shelters, total }` |
| Unauthenticated | `{ ok: false, status: 'unauthenticated', reasons }` |
| Forbidden | `{ ok: false, status: 'forbidden', reasons }` |
| Missing auth adapter | `{ ok: false, status: 'auth_adapter_not_configured', reasons }` |
| Missing repository | `{ ok: false, status: 'admin_pending_shelters_repository_not_configured', reasons }` |
| Request failed | `{ ok: false, status: 'worker_request_failed', reasons }` |
| Invalid response | `{ ok: false, status: 'worker_response_invalid', reasons }` |

## Contract

### Factory

```ts
createAdminPendingSheltersClient({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
})
```

### Method

```ts
loadPendingShelters(query?: { limit?: number | null; offset?: number | null })
```

### HTTP call

- GET `{workerBaseUrl}{shelterPath}/pending-verification`
- Adds `limit` and `offset` query params only when provided.
- Requires a non-blank access token from `getAccessToken`.
- Sends `Authorization: Bearer <token>`.

### Success item

```ts
type AdminPendingShelterClientSummary = {
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

### Privacy and safety

- Client result must not expose credential-bearing reason strings.
- Malformed 200 responses map to `worker_response_invalid`.
- Network throws map to `worker_request_failed` with `network_error`.

## Affected files

| File | Change |
|---|---|
| `docs/work-items/ADMIN-PENDING-SHELTERS-CLIENT-001-admin-pending-shelters-client.md` | This work item |
| `packages/client/src/shelters.ts` | Types, parser, failure mapping, factory |
| `tests/client/admin-pending-shelters-client.test.ts` | Contract tests |

## Acceptance criteria

- [x] Factory is exported from `@pic4paws/client`.
- [x] Success response maps to `{ ok: true, status: 'ok', shelters, total }`.
- [x] URL is `/shelters/pending-verification`.
- [x] `limit` and `offset` are appended when provided and omitted when absent.
- [x] Missing/blank access token returns `unauthenticated` before fetch.
- [x] Request sends `Authorization: Bearer <token>`.
- [x] 401/403/501 route statuses map to typed client failures.
- [x] Fetch throws map to `worker_request_failed` with `network_error`.
- [x] Malformed 200 body maps to `worker_response_invalid`.
- [x] Failure reasons are sanitized.

## Completion Notes

- Added `createAdminPendingSheltersClient` to `@pic4paws/client` via `packages/client/src/shelters.ts`.
- The client calls `GET /shelters/pending-verification`, sends bearer auth, supports optional
  `limit`/`offset`, validates the success payload, maps route-specific failures, and sanitizes
  failure reasons.
- Validation: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test`,
  `npm.cmd run build`, and `graphify update .` completed successfully.
