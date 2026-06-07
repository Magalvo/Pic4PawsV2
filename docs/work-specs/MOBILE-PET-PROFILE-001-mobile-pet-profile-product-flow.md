# Work-Spec: Implementation Plan for MOBILE-PET-PROFILE-001

## 1. Target Files

- `docs/work-items/MOBILE-PET-PROFILE-001-mobile-pet-profile-product-flow.md`
- `docs/work-specs/MOBILE-PET-PROFILE-001-mobile-pet-profile-product-flow.md`
- `apps/mobile/src/pet-profile.ts` (new — Mobile-prefixed mirror of web)
- `apps/mobile/src/foundation.ts` (add petProfile entry)
- `tests/mobile/pet-profile-ui.test.ts` (new)

## 2. Design

Direct `Mobile`-prefixed mirror of `WEB-PET-PROFILE-001`. Types, content constant, factory
and sanitization are structurally identical with `Web` → `Mobile` prefix substitution.

States: `idle`, `loading`, `loaded`, `not_found`, `failed` — same PT-PT copy as Web.

`pet_not_found` maps to its own `not_found` state (not `failed`), same reasoning as Web:
distinct "removed/unavailable" message vs generic error.

## 3. Foundation Update

Add to `MobileFoundationContent`:
```ts
petProfile: Pick<MobilePetProfileUiContent, 'title' | 'description' | 'status'>;
```

Add to `mobileFoundationContent`:
```ts
petProfile: {
  title: mobilePetProfileUiContent.title,
  description: mobilePetProfileUiContent.description,
  status: mobilePetProfileUiContent.status,
},
```

## 4. Testing Strategy

8 tests — identical structure to `tests/web/pet-profile-ui.test.ts` with Mobile imports.

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `state: 'idle'`, PT-PT copy, content locale/status/states |
| 2 | `loadProfile` with valid pet | `state: 'loaded'`, `pet` equals samplePet |
| 3 | `loadProfile`, client returns `pet_not_found` | `state: 'not_found'`, PT-PT title and message |
| 4 | `loadProfile`, client returns `worker_request_failed` | `state: 'failed'`, `canRetry: true` |
| 5 | `loadProfile`, client returns `worker_response_invalid` | `state: 'failed'` |
| 6 | Failed state strips credential markers from reasons | serialized state has no credential strings |
| 7 | `mobilePetProfileUiContent` has pt-PT locale and all 5 states | content contract |
| 8 | Foundation exposes petProfile with product-flow-ready status | `mobileFoundationContent.petProfile.status` |

## 5. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
