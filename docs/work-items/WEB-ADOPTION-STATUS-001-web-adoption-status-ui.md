# WEB-ADOPTION-STATUS-001 — Web Adoption Status UI

## Status: complete

## Summary

Adds the web adoption-status boundary: a 4-state domain UI (`idle / submitting / succeeded / failed`) for shelter staff to update an adoption application's status through the `AdoptionStatusClient`.

## Files changed

| File | Change |
|------|--------|
| `apps/web/src/adoption-status.ts` | New — `webAdoptionStatusUiContent`, state types, `createWebAdoptionStatusUi` |
| `apps/web/src/foundation.ts` | Updated — import + `adoptionStatus` field in `WebFoundationContent` and value |
| `tests/web/adoption-status-ui.test.ts` | New — 11 tests |

## Design

### Domain boundary (`createWebAdoptionStatusUi`)

- `getInitialState()` → `WebAdoptionStatusIdleState` (no client call)
- `manageAdoptionStatus(applicationId, status)` → delegates to `AdoptionStatusClient.manageAdoptionStatus`, returns `WebAdoptionStatusSucceededState | WebAdoptionStatusFailedState`
- Three-layer credential sanitization via `unsafeReasonMarkers` + `sanitizeReasons` — identical pattern to `donation-status`, `sponsorship-manage`
- `canRetry: true` on every failed state

### State shapes

| State | Key fields |
|-------|-----------|
| `idle` | `title`, `message`, `primaryAction` |
| `submitting` | `title`, `message` |
| `succeeded` | `title`, `message`, `applicationId`, `newStatus` |
| `failed` | `title`, `message`, `status`, `reasons`, `canRetry: true` |

### Content

- `locale: 'pt-PT'`
- `status: 'product-flow-ready'`
- All copy in European Portuguese

### Foundation integration

`webFoundationContent.adoptionStatus` exposes `{ title, description, status }` (same slice pattern as all other foundation entries).

## Tests (11)

1. `getInitialState` returns idle state with PT-PT locale marker
2. `webAdoptionStatusUiContent` has all 4 required states
3. Success → `succeeded` state with `applicationId` + `newStatus` (`approved`)
4. Success with `rejected` status
5. Success with `under_review` status
6. `worker_request_failed` → `failed` state with `canRetry`
7. `forbidden` → `failed` state
8. `adoption_not_found` → `failed` state
9. Credential markers stripped from failure reasons
10. `webAdoptionStatusUiContent` locale + status assertions
11. `webFoundationContent.adoptionStatus` exposes `product-flow-ready` status

## Validation

- `vitest run` — 779/779 pass
- `typecheck` — 0 errors
- `lint` — 0 warnings
- `build` — all 9 packages successful

## Dependencies

- **ADOPTION-STATUS-CLIENT-001** — provides `AdoptionStatusClient`, `AdoptionStatusClientResult`, `AdoptionStatusShelterManageStatus`
- **ADOPTION-STATUS-WORKER-001** — worker endpoint consumed by the client
