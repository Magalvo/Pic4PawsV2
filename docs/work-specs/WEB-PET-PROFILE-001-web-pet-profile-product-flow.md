# Work-Spec: Implementation Plan for WEB-PET-PROFILE-001

## 1. Target Files

- `docs/work-items/WEB-PET-PROFILE-001-web-pet-profile-product-flow.md`
- `docs/work-specs/WEB-PET-PROFILE-001-web-pet-profile-product-flow.md`
- `apps/web/src/pet-profile.ts` (new)
- `apps/web/src/foundation.ts` (add petProfile entry)
- `tests/web/pet-profile-ui.test.ts` (new)

## 2. New Types

```ts
// Content block (mirrors WebPetFeedUiContent structure)
export type WebPetProfileUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

// View model states
export type WebPetProfileIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebPetProfileLoadedState = {
  state: 'loaded';
  title: string;
  pet: PetProfilePet;
};

export type WebPetProfileNotFoundState = {
  state: 'not_found';
  title: string;
  message: string;
};

export type WebPetProfileFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: PetProfileClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebPetProfileResultViewModel =
  | WebPetProfileIdleState
  | WebPetProfileLoadedState
  | WebPetProfileNotFoundState
  | WebPetProfileFailedState;
```

## 3. Content (PT-PT)

```ts
export const webPetProfileUiContent: WebPetProfileUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Perfil do animal',
  description: 'Visualiza o perfil completo de um animal publicado.',
  states: [
    { state: 'idle',      title: 'Perfil do animal',         message: 'Pesquisa um animal para ver o seu perfil.' },
    { state: 'loading',   title: 'A carregar...',            message: 'A carregar o perfil do animal.' },
    { state: 'loaded',    title: 'Perfil carregado',         message: '' },
    { state: 'not_found', title: 'Animal não encontrado',    message: 'Este animal pode ter sido removido ou não está disponível.' },
    { state: 'failed',    title: 'Não foi possível carregar', message: 'Verifica a tua ligação e tenta de novo.' },
  ],
};
```

## 4. Factory

```ts
export const createWebPetProfileUi = ({
  profileClient,
}: {
  profileClient: Pick<PetProfileClient, 'loadProfile'>;
}) => ({
  getInitialState: (): WebPetProfileIdleState => ({ ... }),
  loadProfile: async (petId: string): Promise<WebPetProfileResultViewModel> => {
    const result = await profileClient.loadProfile(petId);
    if (result.ok) {
      return { state: 'loaded', title: result.pet.name ?? 'Animal', pet: result.pet };
    }
    if (result.status === 'pet_not_found') {
      return { state: 'not_found', title: '...', message: '...' };
    }
    return { state: 'failed', ..., canRetry: true };
  },
});
```

The `title` in `loaded` state uses `result.pet.name` when present, falls back to `'Animal'`.
`pet_not_found` maps to its own dedicated `not_found` state — not `failed`.

## 5. Foundation Update

Add to `WebFoundationContent`:
```ts
petProfile: Pick<WebPetProfileUiContent, 'title' | 'description' | 'status'>;
```

Add to `webFoundationContent`:
```ts
petProfile: {
  title: webPetProfileUiContent.title,
  description: webPetProfileUiContent.description,
  status: webPetProfileUiContent.status,
},
```

## 6. Testing Strategy

| # | Scenario | Expected |
|---|---|---|
| 1 | `getInitialState()` | `state: 'idle'`, PT-PT title, primaryAction, content locale/status |
| 2 | `loadProfile` with valid pet | `state: 'loaded'`, `pet` equals samplePet |
| 3 | `loadProfile`, client returns `pet_not_found` | `state: 'not_found'`, PT-PT title and message |
| 4 | `loadProfile`, client returns `worker_request_failed` | `state: 'failed'`, `canRetry: true` |
| 5 | `loadProfile`, client returns `worker_response_invalid` | `state: 'failed'` |
| 6 | Failed state strips credential markers from reasons | serialized state has no credential strings |
| 7 | `webPetProfileUiContent` has pt-PT locale and all 5 states | content contract check |
| 8 | Foundation exposes petProfile with product-flow-ready status | `webFoundationContent.petProfile.status` |

## 7. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
