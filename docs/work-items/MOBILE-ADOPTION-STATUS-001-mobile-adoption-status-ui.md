# MOBILE-ADOPTION-STATUS-001 — Mobile Adoption Status UI

## Status: complete

## Summary

Adds the mobile adoption-status boundary: a 4-state domain UI (`idle / submitting / succeeded / failed`) for shelter staff to update an adoption application's status through the `AdoptionStatusClient`.

## Files changed

| File | Change |
|------|--------|
| `apps/mobile/src/adoption-status.ts` | New — `mobileAdoptionStatusUiContent`, state types, `createMobileAdoptionStatusUi` |
| `apps/mobile/src/foundation.ts` | Updated — import + `adoptionStatus` field in `MobileFoundationContent` and value |
| `tests/mobile/adoption-status-ui.test.ts` | New — 12 tests |

## Design

### Domain boundary (`createMobileAdoptionStatusUi`)

- `getInitialState()` → `MobileAdoptionStatusIdleState` (no client call)
- `manageAdoptionStatus(applicationId, status)` → delegates to `AdoptionStatusClient.manageAdoptionStatus`, returns `MobileAdoptionStatusSucceededState | MobileAdoptionStatusFailedState`
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

`mobileFoundationContent.adoptionStatus` exposes `{ title, description, status }` (same slice pattern as all other foundation entries).

## Tests (12)

1. `getInitialState` returns idle state with PT-PT locale marker
2. `mobileAdoptionStatusUiContent` has all 4 required states
3. Success → `succeeded` state with `applicationId` + `newStatus` (`approved`)
4. Success with `rejected` status
5. Success with `more_info_requested` status
6. `worker_request_failed` → `failed` state with `canRetry`
7. `forbidden` → `failed` state
8. `adoption_not_found` → `failed` state
9. Credential markers stripped from failure reasons
10. `mobileAdoptionStatusUiContent` locale + status assertions
11. `mobileFoundationContent.adoptionStatus` exposes `product-flow-ready` status
12. `unauthenticated` → `failed` state with `canRetry`

## Validation

- `vitest run` — 780/780 pass
- `typecheck` — 0 errors
- `lint` — 0 warnings
- `build` — all 9 packages successful

## Dependencies

- **ADOPTION-STATUS-CLIENT-001** — provides `AdoptionStatusClient`, `AdoptionStatusClientResult`, `AdoptionStatusShelterManageStatus`
- **WEB-ADOPTION-STATUS-001** — parallel web implementation (same client, same copy)
