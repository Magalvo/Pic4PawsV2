# Work-Spec: Implementation Plan for WEB-ADOPTION-001

## 1. Target Files

### New
- `docs/work-items/WEB-ADOPTION-001-web-adoption-application-product-boundary.md`
- `docs/work-specs/WEB-ADOPTION-001-web-adoption-application-product-boundary.md`
- `apps/web/src/adoption.ts`
- `tests/web/adoption-ui.test.ts`

### Modified
- `apps/web/src/foundation.ts` — add `adoptionApplication` import + type field + value entry

## 2. Design

Follows the same product boundary pattern as `apps/web/src/shelter-profile.ts`, adapted
for the adoption write path.

States: `idle` → `submitting` → `submitted` or `pet_not_found` or `failed`.
`pet_not_found` is a dedicated state (distinct from `failed`) to allow contextually
appropriate "no longer available" messaging.

### Types

```ts
export type WebAdoptionUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export type WebAdoptionIdleState = { state: 'idle'; title: string; message: string; primaryAction: string };
export type WebAdoptionSubmittingState = { state: 'submitting'; title: string; message: string };
export type WebAdoptionSubmittedState = { state: 'submitted'; title: string; message: string; applicationId: string; submittedAt: string };
export type WebAdoptionPetNotFoundState = { state: 'pet_not_found'; title: string; message: string };
export type WebAdoptionFailedState = {
  state: 'failed'; title: string; message: string;
  status: AdoptionApplicationClientFailureStatus; reasons: string[]; canRetry: true;
};
export type WebAdoptionResultViewModel =
  | WebAdoptionIdleState | WebAdoptionSubmittingState | WebAdoptionSubmittedState
  | WebAdoptionPetNotFoundState | WebAdoptionFailedState;
```

### `createWebAdoptionUi` logic

```
submitApplication(input):
  result = await adoptionApplicationClient.submitApplication(input)
  if result.ok  → submitted state with applicationId + submittedAt
  if result.status === 'pet_not_found' → pet_not_found state
  else → failed state (canRetry: true, sanitized reasons)
```

### PT-PT copy

- idle: title "Candidatura à adoção", message "Preenche o formulário para te candidatares à adoção.",
  primaryAction "Candidatar"
- submitting: "A enviar...", "A enviar a tua candidatura."
- submitted: "Candidatura enviada!", "A tua candidatura foi enviada com sucesso. O abrigo entrará em contacto em breve."
- pet_not_found: "Animal não disponível", "O animal que tentaste adotar já não está disponível."
- failed: "Não foi possível enviar", "Verifica a tua ligação e tenta de novo."

## 3. Foundation Update

```ts
// WebFoundationContent type
adoptionApplication: Pick<WebAdoptionUiContent, 'title' | 'description' | 'status'>;

// webFoundationContent value
adoptionApplication: {
  title: webAdoptionUiContent.title,
  description: webAdoptionUiContent.description,
  status: webAdoptionUiContent.status,
},
```

## 4. Testing Strategy

8 tests in `tests/web/adoption-ui.test.ts`.

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `state: 'idle'`, PT-PT copy, content locale/status/states |
| 2 | `submitApplication` on success | `state: 'submitted'`, applicationId + submittedAt present |
| 3 | `submitApplication`, client returns `pet_not_found` | `state: 'pet_not_found'`, PT-PT title/message |
| 4 | `submitApplication`, client returns `worker_request_failed` | `state: 'failed'`, `canRetry: true` |
| 5 | `submitApplication`, client returns `unauthenticated` | `state: 'failed'` |
| 6 | Failed state strips credential markers | serialized state has no credential strings |
| 7 | `webAdoptionUiContent` has pt-PT locale and all 5 states | content contract |
| 8 | Foundation exposes `adoptionApplication` with `product-flow-ready` status | `webFoundationContent.adoptionApplication.status` |

## 5. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
