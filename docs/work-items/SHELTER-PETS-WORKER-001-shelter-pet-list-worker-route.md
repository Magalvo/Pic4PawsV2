# Work-Item: SHELTER-PETS-WORKER-001 — Shelter Pet List Worker Route

status: in-progress

## 1. Context & Problem

Shelter staff can create, publish, archive and republish individual pets by petId, but have
no way to list all pets belonging to their shelter. Without this endpoint the shelter
management dashboard cannot be built — staff must know a petId out-of-band before taking any
action on a pet.

## 2. Goal

Expose `GET /shelters/:shelterId/pets` returning all pets for the shelter (all statuses),
paginated, newest-updated-first. Access requires shelter membership.

## 3. States / Contract

**States**: 405 | 401 (no token) | 501 (auth not configured) | 401 (bad token) | 403 (not member) | 501 (repo not configured) | 200 ok

**Success contract** (200):
```json
{ "status": "ok", "pets": [ShelterPetSummary], "total": number }
```

**ShelterPetSummary**:
```typescript
{ petId, name, species, status, heroMediaId, locationLabel, createdAt, updatedAt }
```

## 4. Acceptance Criteria

- [ ] `apps/workers/src/shelter-pet-list.ts`:
  - `ShelterPetStatus` union (6 values from pet_status enum)
  - `ShelterPetSummary` type
  - `ListShelterPetsQuery` / `ListShelterPetsResult` types
  - `ShelterPetListRepository` interface with `listPets`
  - `matchWorkerShelterPetsShelterId(pathname, shelterPath)` — extracts shelterId from
    `{shelterPath}/{shelterId}/pets`; returns null for non-matching paths
  - `HandleWorkerShelterPetListRequestInput` type and `handleWorkerShelterPetListRequest` handler
- [ ] Handler flow (in order):
  1. 405 non-GET
  2. 401 missing bearer token
  3. 501 authenticator not configured
  4. 401 auth returns null
  5. 403 `canManageShelter(actor, shelterId)` fails
  6. 501 shelterPetListRepository not configured
  7. Parse limit (default 20, max 100, min 1) and offset (default 0, min 0)
  8. 200 `{ status: 'ok', pets, total }`
- [ ] `apps/workers/src/shelter-pet-list-supabase.ts`:
  - `SupabaseShelterPetListRepositoryError` class
  - `createSupabaseShelterPetListRepositories({ client })` factory
  - Supabase impl: query `pets` table, `{ count: 'exact' }`, `.eq('shelter_id', shelterId)`,
    `.is('deleted_at', null)`, `.order('updated_at', { ascending: false })`, `.range()`
- [ ] Wire into `dependencies.ts` and `index.ts`
- [ ] Route registered before the shelter profile matcher
- [ ] Exports added to `index.ts`
- [ ] Tests use injected fakes — no real network/DB calls
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## 5. Affected Files

- `apps/workers/src/shelter-pet-list.ts` (new)
- `apps/workers/src/shelter-pet-list-supabase.ts` (new)
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/index.ts`
- `tests/workers/shelter-pet-list.test.ts` (new)
- `tests/workers/shelter-pet-list-supabase.test.ts` (new)
