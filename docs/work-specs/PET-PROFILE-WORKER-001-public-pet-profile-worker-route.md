# Work-Spec: Implementation Plan for PET-PROFILE-WORKER-001

## 1. Target Files

- `docs/work-items/PET-PROFILE-WORKER-001-public-pet-profile-worker-route.md`
- `docs/work-specs/PET-PROFILE-WORKER-001-public-pet-profile-worker-route.md`
- `apps/workers/src/pet-profile.ts` (new)
- `apps/workers/src/pet-supabase.ts` (add `loadPublishedPet` + `petProfileRepository`)
- `apps/workers/src/dependencies.ts` (add `petProfileRepository`)
- `apps/workers/src/index.ts` (add profile route + exports)
- `tests/workers/pet-profile.test.ts` (new)
- `tests/workers/pet-supabase-repository.test.ts` (add profile repository test)

## 2. New Types

### `apps/workers/src/pet-profile.ts`

```ts
import type { PetLifecycleSpecies, PublicPetMedicalStatus } from '@pic4paws/domain';

export type PublishedPetProfile = {
  id: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  heroMediaId: string | null;
  mediaIds: string[];
  publishedAt: string;
  medical: PublicPetMedicalStatus;
};

export type PetProfileQuery = { petId: string };

export type PetProfileRepository = {
  loadPublishedPet: (query: PetProfileQuery) => Promise<PublishedPetProfile | null>;
};
```

`matchWorkerPetProfileId(pathname, petFeedPath)` returns the petId string when the path is
`{petFeedPath}/{segment}` with exactly one segment and no trailing slashes, or `null` otherwise.

## 3. Route Design

```
GET /pets/:petId
```

No auth header. No request body. The `:petId` is taken verbatim from the URL path segment.
The profile path prefix is derived from `config.workers.petFeedPath` (default `/pets`) — no new
env var is required.

**Success (200)**:
```json
{ "status": "ok", "pet": { ...PublishedPetProfile } }
```

**Not found (404)**:
```json
{ "status": "pet_not_found" }
```

**Method not allowed (405)**:
```json
{ "status": "method_not_allowed", "allowedMethods": ["GET"] }
```

**Repository not configured (501)**:
```json
{ "status": "pet_profile_repository_not_configured" }
```

## 4. Route Order in `index.ts`

Profile check is placed AFTER the drafts prefix check to prevent `/pets/drafts` or
`/pets/drafts/:id` from being matched as a profile request:

```
GET /health            → exact match
payment webhook        → exact match
media upload           → exact match
GET /pets              → exact match (feed)
/pets/drafts*          → prefix match via matchWorkerPetDraftRoute (drafts handler)
/pets/:petId           → matchWorkerPetProfileId (profile handler)   ← NEW
fallthrough            → 404
```

## 5. Supabase Implementation

Query: select profile columns + `medical`, filter `status = 'published'` and `deleted_at IS NULL`,
single-row lookup by `id`.

```sql
SELECT id, shelter_id, name, species, location_label, short_description,
       hero_media_id, media_ids, published_at, medical
FROM pets
WHERE id = :petId
  AND status = 'published'
  AND deleted_at IS NULL
-- maybeSingle() — returns null when row is absent
```

`petProfileRepository` is added to `CreateSupabasePetRepositoriesResult` and wired into
`WorkerRequestDependencies`, `createWorkerSupabaseDependencies`, and
`resolveWorkerRequestDependencies`.

## 6. Testing Strategy

All tests inject a fake `PetProfileRepository`. No real Supabase calls.

| # | Scenario | Expected |
|---|---|---|
| 1 | GET /pets/:petId, repository returns a profile | 200 with `{ status: 'ok', pet }` |
| 2 | GET /pets/:petId, repository returns null | 404 `pet_not_found` |
| 3 | petId extracted verbatim from URL segment | repository called with `{ petId: 'pet-pub-1' }` |
| 4 | POST /pets/:petId | 405 `method_not_allowed`, `allowedMethods: ['GET']` |
| 5 | No petProfileRepository injected | 501 `pet_profile_repository_not_configured` |
| 6 | medical field present in 200 response | `body.pet.medical` equals the expected object |
| 7 | Response never exposes draft status or credential markers | serialized body has no `"draft"`, `service-role-secret`, `r2-access-key` |

Supabase repository test verifies: column selection, eq/is filters, maybeSingle result type,
and null-when-not-found behaviour.

## 7. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 8. Risk Controls

- The Supabase query hard-filters `status = 'published'` and `deleted_at IS NULL`; draft or
  deleted pets cannot be returned regardless of the petId.
- `PublishedPetProfile` is a strict allowlist — only named columns are selected from Supabase.
- No bearer tokens, service-role keys or signed URLs are included in the response.
- Repository is injected; real Supabase calls only happen in production wiring.
