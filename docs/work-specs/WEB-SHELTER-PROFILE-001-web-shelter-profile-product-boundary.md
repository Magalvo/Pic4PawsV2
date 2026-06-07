# Work-Spec: Implementation Plan for WEB-SHELTER-PROFILE-001

## 1. Target Files

### New
- `docs/work-items/WEB-SHELTER-PROFILE-001-web-shelter-profile-product-boundary.md`
- `docs/work-specs/WEB-SHELTER-PROFILE-001-web-shelter-profile-product-boundary.md`
- `apps/web/src/shelter-profile.ts`
- `tests/web/shelter-profile-ui.test.ts`

### Modified
- `apps/web/src/foundation.ts` — add `shelterProfile` import + type + value

## 2. Design

Direct `Web`-prefixed mirror of `WEB-PET-PROFILE-001` with shelter-specific types and copy.

### `apps/web/src/shelter-profile.ts`

```ts
import type {
  ShelterProfileClient,
  ShelterProfileClientFailureStatus,
  ShelterProfileClientShelter,
} from '@pic4paws/client';

export type WebShelterProfileUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webShelterProfileUiContent: WebShelterProfileUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Perfil do abrigo',
  description: 'Visualiza o perfil completo de um abrigo.',
  states: [
    { state: 'idle',      title: 'Perfil do abrigo',          message: 'Pesquisa um abrigo para ver o seu perfil.' },
    { state: 'loading',   title: 'A carregar...',              message: 'A carregar o perfil do abrigo.' },
    { state: 'loaded',    title: 'Perfil carregado',           message: '' },
    { state: 'not_found', title: 'Abrigo não encontrado',      message: 'Este abrigo pode ter sido removido ou não está disponível.' },
    { state: 'failed',    title: 'Não foi possível carregar',  message: 'Verifica a tua ligação e tenta de novo.' },
  ],
};

// State types: WebShelterProfileIdleState, WebShelterProfileLoadedState,
//              WebShelterProfileNotFoundState, WebShelterProfileFailedState,
//              WebShelterProfileResultViewModel

export const createWebShelterProfileUi = ({ shelterProfileClient }) => ({
  getInitialState: () => WebShelterProfileIdleState,
  loadProfile: async (shelterId) => {
    // ok → loaded with shelter.name as title
    // shelter_not_found → not_found
    // other failure → failed + canRetry + sanitizeReasons
  },
});
```

### Foundation update

```ts
// foundation.ts: add import, add to WebFoundationContent type, add to webFoundationContent value
shelterProfile: Pick<WebShelterProfileUiContent, 'title' | 'description' | 'status'>;
```

## 3. Testing Strategy

### `tests/web/shelter-profile-ui.test.ts` (8 tests)

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `state: 'idle'`, PT-PT copy, content locale/status/states |
| 2 | `loadProfile` with valid shelter | `state: 'loaded'`, `shelter` equals sampleShelter |
| 3 | `loadProfile`, client returns `shelter_not_found` | `state: 'not_found'`, PT-PT title and message |
| 4 | `loadProfile`, client returns `worker_request_failed` | `state: 'failed'`, `canRetry: true` |
| 5 | `loadProfile`, client returns `worker_response_invalid` | `state: 'failed'` |
| 6 | Failed state strips credential markers from reasons | serialized state has no credential strings |
| 7 | `webShelterProfileUiContent` has pt-PT locale and all 5 states | content contract |
| 8 | Foundation exposes `shelterProfile` with `product-flow-ready` status | `webFoundationContent.shelterProfile.status` |

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
