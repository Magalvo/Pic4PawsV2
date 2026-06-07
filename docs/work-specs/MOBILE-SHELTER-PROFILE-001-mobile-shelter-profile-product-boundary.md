# Work-Spec: Implementation Plan for MOBILE-SHELTER-PROFILE-001

## 1. Target Files

### New
- `docs/work-items/MOBILE-SHELTER-PROFILE-001-mobile-shelter-profile-product-boundary.md`
- `docs/work-specs/MOBILE-SHELTER-PROFILE-001-mobile-shelter-profile-product-boundary.md`
- `apps/mobile/src/shelter-profile.ts`
- `tests/mobile/shelter-profile-ui.test.ts`

### Modified
- `apps/mobile/src/foundation.ts` — add `shelterProfile` import + type field + value entry

## 2. Design

Direct `Mobile`-prefixed mirror of `WEB-SHELTER-PROFILE-001`. Types, content constant, factory
and sanitization are structurally identical with `Web` → `Mobile` prefix substitution.

States: `idle`, `loading`, `loaded`, `not_found`, `failed` — same PT-PT copy as Web.

`shelter_not_found` maps to its own `not_found` state (not `failed`), same reasoning as Web:
distinct "removed/unavailable" message vs generic error.

## 3. Foundation Update

Add to `MobileFoundationContent`:
```ts
shelterProfile: Pick<MobileShelterProfileUiContent, 'title' | 'description' | 'status'>;
```

Add to `mobileFoundationContent`:
```ts
shelterProfile: {
  title: mobileShelterProfileUiContent.title,
  description: mobileShelterProfileUiContent.description,
  status: mobileShelterProfileUiContent.status,
},
```

## 4. Testing Strategy

8 tests — identical structure to `tests/web/shelter-profile-ui.test.ts` with Mobile imports.

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `state: 'idle'`, PT-PT copy, content locale/status/states |
| 2 | `loadProfile` with valid shelter | `state: 'loaded'`, `shelter` equals sampleShelter |
| 3 | `loadProfile`, client returns `shelter_not_found` | `state: 'not_found'`, PT-PT title and message |
| 4 | `loadProfile`, client returns `worker_request_failed` | `state: 'failed'`, `canRetry: true` |
| 5 | `loadProfile`, client returns `worker_response_invalid` | `state: 'failed'` |
| 6 | Failed state strips credential markers from reasons | serialized state has no credential strings |
| 7 | `mobileShelterProfileUiContent` has pt-PT locale and all 5 states | content contract |
| 8 | Foundation exposes `shelterProfile` with `product-flow-ready` status | `mobileFoundationContent.shelterProfile.status` |

## 5. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
