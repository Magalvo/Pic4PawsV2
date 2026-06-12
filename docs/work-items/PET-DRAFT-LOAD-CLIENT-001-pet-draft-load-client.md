# PET-DRAFT-LOAD-CLIENT-001 — Pet draft load client

## Goal
Add `loadPetDraft(petId)` to `PetDraftClient` and implement it in `createPetDraftClient`
so UI layers can load a draft for editing.

## States
| Result status | Meaning |
|---|---|
| `ok` | Draft loaded successfully |
| `unauthenticated` | No access token or token rejected |
| `forbidden` | Actor is not a shelter member for this pet |
| `pet_draft_not_found` | Pet does not exist or is soft-deleted |
| `worker_request_failed` | Network error |
| `worker_response_invalid` | Response body did not match expected shape |

## Contract

### Input
```typescript
loadPetDraft(petId: string): Promise<LoadPetDraftClientResult>
```

### Output (success)
```typescript
{
  ok: true;
  status: 'ok';
  draft: {
    petId: string;
    shelterId: string;
    status: string;
    name: string | null;
    species: string | null;
    locationLabel: string | null;
    shortDescription: string | null;
    mediaIds: string[];
    heroMediaId: string | null;
    medical: Record<string, unknown>;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
}
```

### Output (failure)
```typescript
{ ok: false; status: LoadPetDraftClientFailureStatus; reasons: string[] }
```

Credential markers (`service-role`, `bearer`, `r2-secret`, etc.) must be stripped from reasons.

## Affected files
- `packages/client/src/index.ts` (modify) — add types + `loadPetDraft` to `PetDraftClient` + factory
