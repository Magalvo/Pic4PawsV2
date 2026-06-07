# Work-Spec: Implementation Plan for MOBILE-ADOPTION-001

## 1. Target Files

### New
- `docs/work-items/MOBILE-ADOPTION-001-mobile-adoption-application-product-boundary.md`
- `docs/work-specs/MOBILE-ADOPTION-001-mobile-adoption-application-product-boundary.md`
- `apps/mobile/src/adoption.ts`
- `tests/mobile/adoption-ui.test.ts`

### Modified
- `apps/mobile/src/foundation.ts` — add `adoptionApplication` import + type field + value entry

## 2. Design

Direct `Mobile`-prefixed mirror of `WEB-ADOPTION-001`. Types, content constant, factory,
and sanitization are structurally identical with `Web` → `Mobile` prefix substitution.

States: `idle`, `submitting`, `submitted`, `pet_not_found`, `failed` — same PT-PT copy as Web.

`pet_not_found` maps to its own dedicated state (not `failed`), same reasoning as Web:
distinct "no longer available" message vs generic error.

## 3. Foundation Update

Add to `MobileFoundationContent`:
```ts
adoptionApplication: Pick<MobileAdoptionUiContent, 'title' | 'description' | 'status'>;
```

Add to `mobileFoundationContent`:
```ts
adoptionApplication: {
  title: mobileAdoptionUiContent.title,
  description: mobileAdoptionUiContent.description,
  status: mobileAdoptionUiContent.status,
},
```

## 4. Testing Strategy

8 tests — identical structure to `tests/web/adoption-ui.test.ts` with Mobile imports.

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `state: 'idle'`, PT-PT copy, content locale/status/states |
| 2 | `submitApplication` on success | `state: 'submitted'`, applicationId + submittedAt present |
| 3 | `submitApplication`, client returns `pet_not_found` | `state: 'pet_not_found'`, PT-PT title/message |
| 4 | `submitApplication`, client returns `worker_request_failed` | `state: 'failed'`, `canRetry: true` |
| 5 | `submitApplication`, client returns `unauthenticated` | `state: 'failed'` |
| 6 | Failed state strips credential markers | serialized state has no credential strings |
| 7 | `mobileAdoptionUiContent` has pt-PT locale and all 5 states | content contract |
| 8 | Foundation exposes `adoptionApplication` with `product-flow-ready` status | `mobileFoundationContent.adoptionApplication.status` |

## 5. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
