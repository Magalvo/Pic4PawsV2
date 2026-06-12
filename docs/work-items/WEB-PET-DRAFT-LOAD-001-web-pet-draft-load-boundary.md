# WEB-PET-DRAFT-LOAD-001 — Web pet draft load boundary

## Goal
Add `loadDraft(petId)` to `createWebPetDraftUi` so the web app can fetch a draft
and pre-populate the edit form.

## States
| State | Trigger |
|---|---|
| `loaded` | Draft returned successfully |
| `not_found` | 404 from worker |
| `forbidden` | 403 from worker |
| `failed` | Any other error (network, invalid response, unauthenticated) |

## Contract

### New types
```typescript
type WebPetDraftLoadedState = {
  state: 'loaded';
  title: string;
  draft: LoadPetDraftClientDraft;
};

type WebPetDraftLoadNotFoundState = {
  state: 'not_found';
  message: string;
};

type WebPetDraftLoadForbiddenState = {
  state: 'forbidden';
  message: string;
};

type WebPetDraftLoadFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: LoadPetDraftClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

type WebPetDraftLoadViewModel =
  | WebPetDraftLoadedState
  | WebPetDraftLoadNotFoundState
  | WebPetDraftLoadForbiddenState
  | WebPetDraftLoadFailedState;
```

### Method added to `WebPetDraftUi`
```typescript
loadDraft(petId: string): Promise<WebPetDraftLoadViewModel>;
```

### `CreateWebPetDraftUiInput` change
Pick `loadPetDraft` from `PetDraftClient` (added to existing pick).

### Sanitization
Failed state reasons must have credential markers stripped.

## Affected files
- `apps/web/src/pet-draft.ts` (modify) — add load state types + `loadDraft` method
