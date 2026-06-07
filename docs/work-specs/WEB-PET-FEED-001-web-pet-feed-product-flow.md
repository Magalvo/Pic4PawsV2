# Work-Spec: Implementation Plan for WEB-PET-FEED-001

## 1. Target Files

- `docs/work-items/WEB-PET-FEED-001-web-pet-feed-product-flow.md`
- `docs/work-specs/WEB-PET-FEED-001-web-pet-feed-product-flow.md`
- `apps/web/src/pet-feed.ts` (new)
- `apps/web/src/foundation.ts` (add `petFeed` to content)
- `tests/web/pet-feed-ui.test.ts` (new)

## 2. New Types and Exports

```ts
// apps/web/src/pet-feed.ts

export type WebPetFeedIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebPetFeedLoadedState = {
  state: 'loaded';
  title: string;
  pets: PetFeedPet[];
  total: number;
  query: PetFeedClientQuery;
};

export type WebPetFeedEmptyState = {
  state: 'empty';
  title: string;
  message: string;
  query: PetFeedClientQuery;
};

export type WebPetFeedFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: PetFeedClientFailureStatus;
  reasons: string[];
  canRetry: boolean;
};

export type WebPetFeedResultViewModel =
  | WebPetFeedIdleState
  | WebPetFeedLoadedState
  | WebPetFeedEmptyState
  | WebPetFeedFailedState;

export type WebPetFeedUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webPetFeedUiContent: WebPetFeedUiContent = { ... };
```

The states exported on `webPetFeedUiContent.states` are: `'idle'`, `'loading'`, `'loaded'`, `'empty'`, `'failed'`.

## 3. PT-PT Copy

| State | title | message |
|---|---|---|
| idle | `'Explorar animais'` | `'Descobre os animais disponíveis para adoção.'` |
| loading | `'A carregar...'` | `'A procurar animais disponíveis.'` |
| loaded | `'Animais disponíveis'` | — (data-driven, N animais encontrados) |
| empty | `'Nenhum animal encontrado'` | `'Tenta ajustar os filtros ou volta mais tarde.'` |
| failed | `'Não foi possível carregar'` | `'Verifica a tua ligação e tenta de novo.'` |

`primaryAction` on idle: `'Ver animais'`

## 4. Factory

```ts
export const createWebPetFeedUi = ({
  feedClient,
}: {
  feedClient: Pick<PetFeedClient, 'loadFeed'>;
}) => ({
  getInitialState: (): WebPetFeedIdleState => ({ ... }),
  loadFeed: async ({ query }: { query: PetFeedClientQuery }): Promise<WebPetFeedResultViewModel> => {
    const result = await feedClient.loadFeed(query);
    if (!result.ok) { return { state: 'failed', ... }; }
    if (result.pets.length === 0) { return { state: 'empty', ... }; }
    return { state: 'loaded', title: 'Animais disponíveis', pets: result.pets, total: result.total, query };
  },
});
```

## 5. Foundation Wiring

Add to `apps/web/src/foundation.ts`:
```ts
import { webPetFeedUiContent, type WebPetFeedUiContent } from './pet-feed';

// In WebFoundationContent type:
petFeed: Pick<WebPetFeedUiContent, 'title' | 'description' | 'status'>

// In webFoundationContent object:
petFeed: { title: webPetFeedUiContent.title, description: webPetFeedUiContent.description, status: webPetFeedUiContent.status }
```

## 6. Testing Strategy

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | idle state with PT-PT copy |
| 2 | `loadFeed` with 2 pets | `loaded` state with pets + total |
| 3 | `loadFeed` with 0 pets | `empty` state with PT-PT copy |
| 4 | `loadFeed` fails `worker_request_failed` | `failed` state with PT-PT copy |
| 5 | `loadFeed` fails `worker_response_invalid` | `failed` state |
| 6 | failure result has no credential markers | `JSON.stringify` check |
| 7 | `webPetFeedUiContent.locale === 'pt-PT'` | content check |
| 8 | foundation content exposes `petFeed.status === 'product-flow-ready'` | foundation check |
