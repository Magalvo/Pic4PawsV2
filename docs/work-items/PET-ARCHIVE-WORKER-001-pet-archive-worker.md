# PET-ARCHIVE-WORKER-001 — Pet Archive Worker Route

## Goal

Add `PATCH /pets/:petId/status` to the Cloudflare Worker so shelter staff can
archive a pet. Only shelter members of the owning shelter may archive.

## Route

| Method | Path | Auth |
|---|---|---|
| `PATCH` | `/{petFeedPath}/{petId}/status` | Bearer — shelter member of pet's shelter |

Body: `{ "status": "archived" }`

## Success response

```json
HTTP 200
{ "status": "ok", "petId": "<petId>" }
```

## Error responses

| HTTP | status field | Condition |
|---|---|---|
| 405 | `method_not_allowed` | Non-PATCH request |
| 501 | `pet_archive_repository_not_configured` | Repository not injected |
| 501 | `auth_adapter_not_configured` | Authenticator not injected |
| 401 | `unauthenticated` | Missing or invalid Bearer token |
| 400 | `invalid_payload` | Body missing or `status !== 'archived'` |
| 404 | `pet_not_found` | No pet with this id |
| 403 | `forbidden` | Actor is not a member of the pet's shelter |
| 409 | `pet_already_archived` | Pet is already archived |

## Repository interface

```typescript
type PetArchiveRecord = {
  petId: string;
  shelterId: string;
  lifecycleStatus: string;
};

type PetArchiveRepository = {
  getPetForArchive: (petId: string) => Promise<PetArchiveRecord | null>;
  archivePet: (input: { petId: string; now: string }) => Promise<{ petId: string } | null>;
};
```

`archivePet` returns `null` when the pet is already archived (no-op update).

## Path matcher

`matchWorkerPetArchiveId(pathname, petFeedPath)` returns the `petId` string when
pathname is exactly `{petFeedPath}/{petId}/status`, otherwise null.

## Placement in index.ts

The archive check must be registered **before** `matchWorkerPetProfileId` since the
profile matcher already rejects paths with extra segments — but explicit ordering is
clearer. Order within the pets section:

1. `config.workers.petFeedPath` exact match → pet feed
2. `petDraftRoute.matched` → pet draft handler
3. **NEW** `matchWorkerPetArchiveId` → pet archive handler
4. `matchWorkerPetProfileId` → pet profile handler

## Acceptance criteria

- [ ] `matchWorkerPetArchiveId` returns petId for `/{petFeedPath}/{petId}/status`
- [ ] `matchWorkerPetArchiveId` returns null for `/{petFeedPath}/{petId}` (no suffix)
- [ ] `matchWorkerPetArchiveId` returns null for `/{petFeedPath}/{petId}/other`
- [ ] `validatePetArchivePayload` accepts `{ status: 'archived' }` only
- [ ] 405 on non-PATCH
- [ ] 501 when repository missing
- [ ] 501 when authenticator missing
- [ ] 401 when no/blank bearer token
- [ ] 401 when actor resolves to null
- [ ] 400 on invalid payload
- [ ] 404 when `getPetForArchive` returns null
- [ ] 403 when actor not a member of the pet's shelter
- [ ] 409 when `archivePet` returns null
- [ ] 200 `{ status: 'ok', petId }` on success
- [ ] All tests passing, typecheck clean, lint clean, build clean
