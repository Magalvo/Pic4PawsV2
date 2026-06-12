# PET-DRAFT-LOAD-WORKER-001 — Pet draft load worker route

## Goal
Add `GET /pet-drafts/:petId` so shelter members can fetch the full draft record
(including `createdAt` / `updatedAt`) to pre-populate an edit form.

## States
| State | Trigger |
|---|---|
| 405 | non-GET method |
| 401 | missing or invalid bearer token |
| 501 | auth adapter not configured |
| 501 | pet draft repository not configured |
| 404 | pet not found (or soft-deleted) |
| 403 | actor is not a member of the pet's shelter |
| 200 | success — draft record returned |

## Contract

### Request
```
GET /pet-drafts/:petId
Authorization: Bearer <token>
```

### Response 200
```json
{
  "status": "ok",
  "draft": {
    "petId": "string",
    "shelterId": "string",
    "status": "draft | published | ...",
    "name": "string | null",
    "species": "dog | cat | ... | null",
    "locationLabel": "string | null",
    "shortDescription": "string | null",
    "mediaIds": ["string"],
    "heroMediaId": "string | null",
    "medical": {},
    "publishedAt": "string | null",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### Error responses
- 405 `{ status: 'method_not_allowed', allowedMethods: ['GET'] }`
- 401 `{ status: 'unauthenticated' }`
- 501 `{ status: 'auth_adapter_not_configured' }`
- 501 `{ status: 'pet_draft_repository_not_configured' }`
- 404 `{ status: 'pet_draft_not_found' }`
- 403 `{ status: 'forbidden' }`

## Affected files
- `apps/workers/src/pet-draft-load.ts` (new) — handler + types
- `apps/workers/src/pet-drafts.ts` (modify) — add `loadDraft` to `PetDraftRepository`
- `apps/workers/src/pet-supabase.ts` (modify) — implement `loadDraft`
- `apps/workers/src/index.ts` (modify) — intercept GET before body-parse; add exports
